import { join } from 'node:path'
import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import { createUtcIsoString, shiftDaysBack } from '~~/utils/function'
import { account } from '~/lib/db/schema/account'
import type { BankProvider, BankChannel } from '~/lib/db/schema/bankingAgreement'
import { logger } from '~/lib/logger'
import { parseCamt053Xml } from './camt053/parseCamt053Xml'
import { LocalFileBankAdapter } from '../infrastructure/localFileBankAdapter'
import { buildBankMeta } from '~~/utils/function'
import type { BankAdapter } from '../ports/bankAdapter'

function isRecoverableContentNotFound(provider: BankProvider, error: unknown): boolean {
  if (provider !== 'nordea') return false
  const message = String((error as any)?.message ?? error)
  return message.includes('Nordea ResponseHeader 24') || message.toLowerCase().includes('content not found')
}

function toAccountId(input: { iban: string | null; currency: string | null }): string | null {
  const iban = String(input.iban ?? '').trim()
  const currency = String(input.currency ?? '').trim()
  if (!iban || !currency) return null
  return `${iban}-${currency}`
}

function buildIso20022Adapter(provider: BankProvider): BankAdapter {
  const adapterKeyOverride = `${process.env.BANK_ADAPTER ?? ''}`.trim()
  if (adapterKeyOverride === 'local-file') {
    return new LocalFileBankAdapter({
      key: 'nordea-example-file',
      filePath: join(process.cwd(), 'resources', 'banking', 'nordea', 'examples', 'camt.053e.xml'),
      filename: 'camt.053e.xml',
      lookbackDays: 7,
    })
  }

  return buildBankMeta(provider) // throws if provider is unknown

}

export async function discoverAgreementAccounts(options: {
  provider: BankProvider
  channel: BankChannel
  bookingDate: Date
}): Promise<{ discoveredAccounts: number; inspectedDocuments: number; skippedDays: number }> {
  const log = logger.child({ scope: 'banking.discoverAgreementAccounts', provider: options.provider, channel: options.channel })

  if (options.channel !== 'iso20022') {
    return { discoveredAccounts: 0, inspectedDocuments: 0, skippedDays: 0 }
  }

  const adapter = buildIso20022Adapter(options.provider)
  const lookbackRaw = Number(adapter.lookbackDays)
  const lookbackDays = Number.isFinite(lookbackRaw) && lookbackRaw >= 1
    ? Math.min(Math.trunc(lookbackRaw), 31)
    : 7

  const anchorBookingDate = createUtcIsoString(options.bookingDate)
  log.info('Account discovery started', {
    provider: options.provider,
    channel: options.channel,
    adapterKey: adapter.key,
    anchorBookingDate,
    lookbackDays,
  })

  const knownIds = new Set<string>()
  let discoveredAccounts = 0
  let inspectedDocuments = 0
  let skippedDays = 0

  for (let daysBack = 0; daysBack < lookbackDays; daysBack += 1) {
    const bookingDate = createUtcIsoString(shiftDaysBack(options.bookingDate, daysBack))
    let fetched: Awaited<ReturnType<BankAdapter['fetchDocuments']>>
    try {
      fetched = await adapter.fetchDocuments({
        accountId: `provider:${options.provider}`,
        cursor: null,
        limit: 25,
        bookingDate,
      })
    } catch (error) {
      if (!isRecoverableContentNotFound(options.provider, error)) {
        skippedDays += 1
        log.warn('Account discovery skipped date due to adapter error', {
          bookingDate,
          anchorBookingDate,
          lookbackDays,
          adapterKey: adapter.key,
          provider: options.provider,
          reason: String((error as any)?.message ?? error),
        })
        continue
      }

      skippedDays += 1
      log.warn('Account discovery skipped date due to no content', {
        bookingDate,
        anchorBookingDate,
        lookbackDays,
        adapterKey: adapter.key,
        provider: options.provider,
        reason: String((error as any)?.message ?? error),
      })
      continue
    }

    inspectedDocuments += fetched.documents.length

    for (const doc of fetched.documents) {
      if (doc.format !== 'camt053') continue

      const parsed = parseCamt053Xml(doc.content)
      for (const stmt of parsed.statements) {
        const accountId = toAccountId({ iban: stmt.iban, currency: stmt.currency })
        if (!accountId || knownIds.has(accountId)) continue
        knownIds.add(accountId)

        const [existing] = await db
          .select({ id: account.id })
          .from(account)
          .where(eq(account.id, accountId))
          .limit(1)

        if (!existing) {
          await db.insert(account).values({
            id: accountId,
            provider: options.provider,
            iban: String(stmt.iban ?? '').trim(),
            currency: String(stmt.currency ?? '').trim() || null,
            name: stmt.ownerName,
          })
          discoveredAccounts += 1
        }
      }
    }
  }

  log.info('Account discovery completed', {
    bookingDate: anchorBookingDate,
    adapterKey: adapter.key,
    lookbackDays,
    skippedDays,
    inspectedDocuments,
    discoveredAccounts,
  })

  return {
    discoveredAccounts,
    inspectedDocuments,
    skippedDays,
  }
}
