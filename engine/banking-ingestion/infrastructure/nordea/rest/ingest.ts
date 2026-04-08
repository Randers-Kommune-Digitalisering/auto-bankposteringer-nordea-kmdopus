import { asc, eq } from 'drizzle-orm'
import { logger } from '~/lib/logger'
import { bankingAgreementAccountAllowlist } from '~/lib/db/schema/bankingAgreementAccountAllowlist'
import { account } from '~/lib/db/schema/account'

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

  if (!allowlisted.length) {
    log.warn('Nordea REST: ingen allowlisted konti i banking_agreement_account_allowlist')
    return { insertedStatements: 0, insertedBalances: 0, insertedTransactions: 0, deduplicated: false }
  }

  let accountList: Awaited<ReturnType<typeof client.listAccounts>>
  try {
    accountList = await client.listAccounts({ bearerToken: bearer })
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
    accountList = await client.listAccounts({ bearerToken: bearer })
  }

  const accountsRaw = accountList.accounts

  const findAccountForIban = (iban: string): any | null => {
    const needle = iban.replace(/\s+/g, '').toUpperCase()
    for (const a of accountsRaw as any[]) {
      if (!a || typeof a !== 'object') continue
      const candidate =
        pickString((a as any).iban) ??
        pickString((a as any).IBAN) ??
        pickString((a as any).bankAccount) ??
        pickString((a as any).bank_account)
      if (!candidate) continue
      const normalized = candidate.replace(/\s+/g, '').toUpperCase()
      if (normalized === needle) return a
    }
    return null
  }

  let insertedStatements = 0
  let insertedBalances = 0
  let insertedTransactions = 0
  let deduplicated = false

  for (const row of allowlisted) {
    const resolved = findAccountForIban(row.iban)
    if (!resolved) {
      log.warn('Nordea REST: allowlisted IBAN ikke fundet i /accounts response', { iban: row.iban })
      continue
    }

    const currency =
      pickString((resolved as any).currency) ?? pickString((resolved as any).ccy) ?? pickString((resolved as any).Ccy)

    const accountRef =
      pickString((resolved as any).bankAccount) ??
      pickString((resolved as any).bank_account) ??
      pickString((resolved as any).account_id) ??
      pickString((resolved as any).accountId) ??
      row.iban

    const ownerName = row.name ?? pickString((resolved as any).name) ?? null

    if (!currency) {
      log.warn('Nordea REST: konto mangler currency i /accounts response', { iban: row.iban })
      continue
    }

    const derivedAccountId = `${row.iban}-${currency}`

    await trx
      .insert(account)
      .values({ id: derivedAccountId, provider: 'nordea' as any, name: ownerName, statusAccount: 9999 })
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
