import { and, asc, eq } from 'drizzle-orm'
import { logger } from '~/lib/logger'
import appEnv from '~/lib/env/env'
import { bankingAgreementAccountAllowlist } from '~/lib/db/schema/bankingAgreementAccountAllowlist'
import { account } from '~/lib/db/schema/account'
import { bankingAgreementAccountDimension } from '~/lib/db/schema/bankingAgreementAccountDimension'

import { getAdapterCursor, setAdapterCursor } from '../../../handlers/bankAdapterCursorStore'
import { ingestCamt053Document } from '../../../handlers/ingestCamt053Document'

import { loadNordeaRestEnv } from './env'
import { NordeaCorporateRestClient } from './client'
import { getNordeaRestAccessToken } from './auth'
import { buildCamt053XmlFromNordeaRestTransactions } from './camt053'
import { NORDEA_REST_TRANSACTIONS_ADAPTER_KEY } from './constants'

function toDateOnlyUtc(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function pickString(v: any): string | null {
  if (v == null) return null
  if (typeof v === 'string') {
    const t = v.trim()
    return t.length ? t : null
  }
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return null
}

function normalizeAccountKey(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase()
}

function stripCurrencySuffix(value: string): string {
  // Nordea REST `/accounts` uses `_id` values like `DK2000...-DKK`.
  // For matching allowlisted IBANs (and derived DK+BBAN keys), we want a comparable key without the currency suffix.
  return value.replace(/-[A-Z]{3}$/i, '')
}

/**
 * Nordea REST /accounts sometimes returns Danish account identifiers in a "DK+BBAN" form
 * (e.g. "DK2000...") while allowlists often use full IBAN (e.g. "DK65...").
 * For DK IBAN, we can derive the DK+BBAN form by dropping the 2-digit checksum.
 */
function deriveDkBbanKeyFromIbanOrAccount(value: string): string | null {
  const n = normalizeAccountKey(value)
  if (!n.startsWith('DK')) return null
  const stripped = stripCurrencySuffix(n)

  // DK BBAN key (as used by Nordea identifiers) is:
  // DK + 4-digit regnr + 10-digit kontonr (14 digits total).
  if (/^DK\d{14}$/.test(stripped)) return stripped

  // DK IBAN is: DK + 2 checksum digits + 14 BBAN digits (16 digits total after DK).
  if (/^DK\d{16}$/.test(stripped)) return `DK${stripped.slice(4)}`

  return null
}

function buildComparableKeys(value: string): string[] {
  const n = normalizeAccountKey(value)
  const stripped = stripCurrencySuffix(n)
  const keys = new Set<string>()
  if (n) keys.add(n)
  if (stripped && stripped !== n) keys.add(stripped)

  const dk = deriveDkBbanKeyFromIbanOrAccount(stripped)
  if (dk) keys.add(dk)
  return Array.from(keys)
}

function isUnauthorized(err: unknown): boolean {
  return String((err as any)?.message ?? err).includes('HTTP 401')
}

export async function runNordeaRestIngestion(
  trx: any,
  input: { runId: string; bookingDate: Date },
): Promise<{ insertedStatements: number; insertedBalances: number; insertedTransactions: number; deduplicated: boolean }> {
  const log = logger.child({ scope: 'banking.nordeaRestIngestion' })

  const env = loadNordeaRestEnv()

  const client = new NordeaCorporateRestClient({
    host: env.NORDEA_REST_HOST,
    clientId: env.NORDEA_REST_CLIENT_ID,
    clientSecret: env.NORDEA_REST_CLIENT_SECRET,
    eidasPrivateKeyPem: env.eidasPrivateKeyPem,
    timeoutMs: env.NORDEA_REST_TIMEOUT_MS,
  })

  const bookingDateOnly = toDateOnlyUtc(input.bookingDate)
  const fromDate = new Date(`${bookingDateOnly}T00:00:00.000Z`)
  const toDate = fromDate

  let bearer = await getNordeaRestAccessToken(trx as any, {
    client,
    provider: 'nordea',
    agreementNumber: env.NORDEA_REST_AGREEMENT_NUMBER,
    authorizerId: env.NORDEA_REST_AUTHORIZER_ID,
    durationSeconds: env.NORDEA_REST_ACCESS_DURATION_SEC,
    scopes: env.scopes,
  })

  const allowlisted = await trx
    .select({ iban: bankingAgreementAccountAllowlist.iban, name: bankingAgreementAccountAllowlist.name })
    .from(bankingAgreementAccountAllowlist)
    .where(eq(bankingAgreementAccountAllowlist.provider, 'nordea' as any))
    .orderBy(asc(bankingAgreementAccountAllowlist.iban))

  const ignoredRows = await trx
    .select({ iban: bankingAgreementAccountDimension.iban, value: bankingAgreementAccountDimension.dimensionValue })
    .from(bankingAgreementAccountDimension)
    .where(and(
      eq(bankingAgreementAccountDimension.provider, 'nordea' as any),
      eq(bankingAgreementAccountDimension.dimensionKey, 'ignore_ingestion'),
    ))

  const ignoredIbans = new Set(
    ignoredRows
      .filter((row) => /^(1|true|yes)$/i.test(String(row.value ?? '').trim()))
      .map((row) => String(row.iban ?? '').trim().toUpperCase()),
  )

  const allowlistedActive = allowlisted.filter((row) => !ignoredIbans.has(String(row.iban).trim().toUpperCase()))

  if (!allowlistedActive.length) {
    log.warn('Nordea REST: ingen allowlisted konti i banking_agreement_account_allowlist')
    return { insertedStatements: 0, insertedBalances: 0, insertedTransactions: 0, deduplicated: false }
  }

  const allowlistedKeySet = new Set<string>()
  for (const r of allowlistedActive) {
    for (const k of buildComparableKeys(String(r.iban))) allowlistedKeySet.add(k)
  }

  const accountsRaw: unknown[] = []
  const pageSize = 30
  let page = 1
  let guard = 0
  while (guard < 50) {
    guard += 1
    let accountList: Awaited<ReturnType<typeof client.listAccounts>>
    try {
      accountList = await client.listAccounts({ bearerToken: bearer, page, size: pageSize })
    } catch (err) {
      if (!isUnauthorized(err)) throw err
      bearer = await getNordeaRestAccessToken(trx as any, {
        client,
        provider: 'nordea',
        agreementNumber: env.NORDEA_REST_AGREEMENT_NUMBER,
        authorizerId: env.NORDEA_REST_AUTHORIZER_ID,
        durationSeconds: env.NORDEA_REST_ACCESS_DURATION_SEC,
        scopes: env.scopes,
      })
      accountList = await client.listAccounts({ bearerToken: bearer, page, size: pageSize })
    }

    accountsRaw.push(...accountList.accounts)

    // Stop early if all allowlisted IBANs are present in the accounts we have.
    const presentKeys = new Set<string>()
    for (const a of accountsRaw as any[]) {
      const candidate =
        pickString((a as any)?._id) ??
        pickString((a as any)?.id) ??
        pickString((a as any)?.iban) ??
        pickString((a as any)?.IBAN) ??
        pickString((a as any)?.bban) ??
        pickString((a as any)?.bankAccount) ??
        pickString((a as any)?.bank_account)
      if (!candidate) continue
      for (const k of buildComparableKeys(candidate)) presentKeys.add(k)
    }
    let allFound = true
    for (const k of allowlistedKeySet) {
      if (!presentKeys.has(k)) {
        allFound = false
        break
      }
    }
    if (allFound) break

    if (!accountList.nextPage) break
    page = accountList.nextPage
  }

  const findAccountForIban = (iban: string): any | null => {
    const needles = new Set(buildComparableKeys(iban))
    for (const a of accountsRaw as any[]) {
      if (!a || typeof a !== 'object') continue
      const candidate =
        pickString((a as any)._id) ??
        pickString((a as any).id) ??
        pickString((a as any).iban) ??
        pickString((a as any).IBAN) ??
        pickString((a as any).bban) ??
        pickString((a as any).bankAccount) ??
        pickString((a as any).bank_account)
      if (!candidate) continue
      const candidateKeys = buildComparableKeys(candidate)
      if (candidateKeys.some((k) => needles.has(k))) return a
    }
    return null
  }

  let insertedStatements = 0
  let insertedBalances = 0
  let insertedTransactions = 0
  let deduplicated = false

  for (const row of allowlistedActive) {
    const resolved = findAccountForIban(row.iban)
    if (!resolved) {
      log.warn('Nordea REST: allowlisted IBAN ikke fundet i /accounts response', { iban: row.iban })
      continue
    }

    const currency =
      pickString((resolved as any).currency) ?? pickString((resolved as any).ccy) ?? pickString((resolved as any).Ccy)

    const ownerName = row.name ?? pickString((resolved as any).name) ?? null

    if (!currency) {
      log.warn('Nordea REST: konto mangler currency i /accounts response', { iban: row.iban })
      continue
    }

    // Nordea expects the account identifier from /accounts (typically `_id`, e.g. DK2000...-DKK)
    // when calling /accounts/{account_id}/transactions. Using a raw IBAN will be rejected.
    const accountRef =
      pickString((resolved as any)._id) ??
      pickString((resolved as any).account_id) ??
      pickString((resolved as any).accountId) ??
      pickString((resolved as any).id) ??
      pickString((resolved as any).bankAccount) ??
      pickString((resolved as any).bank_account) ??
      deriveDkBbanKeyFromIbanOrAccount(row.iban)?.concat(`-${currency.toUpperCase()}`) ??
      null

    if (!accountRef) {
      log.warn('Nordea REST: kunne ikke udlede account_id for /transactions (mangler _id/account_id)', {
        iban: row.iban,
      })
      continue
    }

    const derivedAccountId = `${row.iban}-${currency}`

    await trx
      .insert(account)
      .values({
        id: derivedAccountId,
        provider: 'nordea' as any,
        iban: row.iban,
        currency,
        name: ownerName,
      })
      .onConflictDoNothing({ target: account.id })

    const existingCursor = await getAdapterCursor(trx as any, {
      accountId: derivedAccountId,
      adapterKey: NORDEA_REST_TRANSACTIONS_ADAPTER_KEY,
    })

    let continuationKey: string | null = null
    if (existingCursor?.value) {
      try {
        const parsed = JSON.parse(existingCursor.value)
        if (parsed?.bookingDate === bookingDateOnly && typeof parsed?.continuationKey === 'string') {
          continuationKey = parsed.continuationKey
        }
      } catch {
        // ignore
      }
    }

    const allTransactions: unknown[] = []
    let pages = 0
    const maxPages = 50
    let nextKey: string | null = continuationKey

    while (pages < maxPages) {
      let page: Awaited<ReturnType<typeof client.listTransactions>>
      try {
        page = await client.listTransactions({
          bearerToken: bearer,
          accountRef,
          fromDate: bookingDateOnly,
          toDate: bookingDateOnly,
          continuationKey: nextKey,
        })
      } catch (err) {
        if (!isUnauthorized(err)) throw err
        bearer = await getNordeaRestAccessToken(trx as any, {
          client,
          provider: 'nordea',
          agreementNumber: env.NORDEA_REST_AGREEMENT_NUMBER,
          authorizerId: env.NORDEA_REST_AUTHORIZER_ID,
          durationSeconds: env.NORDEA_REST_ACCESS_DURATION_SEC,
          scopes: env.scopes,
        })

        page = await client.listTransactions({
          bearerToken: bearer,
          accountRef,
          fromDate: bookingDateOnly,
          toDate: bookingDateOnly,
          continuationKey: nextKey,
        })
      }

      allTransactions.push(...page.transactions)
      nextKey = page.continuationKey
      pages += 1
      if (!nextKey) break
    }

    const xml = buildCamt053XmlFromNordeaRestTransactions({
      messageId: `nordea-rest:${row.iban}:${bookingDateOnly}`,
      createdAtIso: fromDate.toISOString(),
      account: { iban: row.iban, currency, ownerName },
      fromDate,
      toDate,
      transactions: allTransactions,
    })

    const ingestResult = await ingestCamt053Document(trx as any, {
      runId: input.runId,
      provider: 'nordea',
      filename: `nordea-rest-${row.iban}-${bookingDateOnly}.xml`,
      xml,
    })

    insertedStatements += ingestResult.insertedStatements
    insertedBalances += ingestResult.insertedBalances
    insertedTransactions += ingestResult.insertedTransactions
    deduplicated = deduplicated || ingestResult.deduplicated

    await setAdapterCursor(trx as any, {
      accountId: derivedAccountId,
      adapterKey: NORDEA_REST_TRANSACTIONS_ADAPTER_KEY,
      cursor: { value: JSON.stringify({ bookingDate: bookingDateOnly, continuationKey: nextKey }) },
    })
  }

  return { insertedStatements, insertedBalances, insertedTransactions, deduplicated }
}
