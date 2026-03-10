import 'dotenv/config'
import { eq, sql } from 'drizzle-orm'

import db from '../../app/lib/db'

import { account } from '../../app/lib/db/schema/account'
import { document } from '../../app/lib/db/schema/document'
import { erpRequest, erpResponse } from '../../app/lib/db/schema/erp'
import { errorLog } from '../../app/lib/db/schema/error'
import { run } from '../../app/lib/db/schema/run'
import { rule } from '../../app/lib/db/schema/rule'
import { transaction, transactionProcessing } from '../../app/lib/db/schema/transaction'

const SEED_KEY_RUN_ID = '11111111-1111-1111-1111-111111111111'

const seedIds = {
  runs: {
    latest: '11111111-1111-1111-1111-111111111111',
    processing: '22222222-2222-2222-2222-222222222222',
    done: '33333333-3333-3333-3333-333333333333',
    failed: '44444444-4444-4444-4444-444444444444',
  },
  transactions: {
    t1: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    t2: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    t3: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    t4: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    t5: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  },
  documents: {
    d1: '55555555-5555-5555-5555-555555555555',
    d2: '66666666-6666-6666-6666-666666666666',
  },
  errors: {
    e1: '77777777-7777-7777-7777-777777777777',
    e2: '88888888-8888-8888-8888-888888888888',
  },
  erpRequests: {
    r1: 'seed-erp-request-1',
    r2: 'seed-erp-request-2',
    r3: 'seed-erp-request-3',
  },
  erpResponses: {
    b1: 'BILAG-2026-0001',
    b2: 'BILAG-2026-0002',
    b3: 'BILAG-2026-0003',
  },
} as const

const csvBase64 = 'aWQsbmFtZSxhbW91bnQKMSxUZXN0LDEwMAoyLE1vY2ssMjAw'

const pdfBase64 =
  'JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwvVHlwZS9DYXRhbG9nL1BhZ2VzIDIgMCBSPj4KZW5kb2JqCjIgMCBvYmoKPDwvVHlwZS9QYWdlcy9Db3VudCAxL0tpZHNbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgMjAwIDIwMF0vQ29udGVudHMgNCAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDUgMCBSPj4+Pj4+PgplbmRvYmoKNCAwIG9iago8PC9MZW5ndGggNDQ+PnN0cmVhbQpCVCAvRjEgMTIgVGYgNTAgMTUwIFRkIChNb2NrIFBERikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L0hlbHZldGljYT4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYKMDAwMDAwMDA5MCAwMDAwMCBuCjAwMDAwMDAxNTMgMDAwMDAgbgowMDAwMDAwMjQwIDAwMDAwIG4KMDAwMDAwMDM0MCAwMDAwMCBuCjAwMDAwMDA0MjAgMDAwMDAgbgplbmR4cmVmCjQ5MQolJUVPRgo='

function dateOnly(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function daysAgo(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() - days)
  return dateOnly(d)
}

async function hasSeedData(): Promise<boolean> {
  const [runRows, erpRows] = await Promise.all([
    db.select({ id: run.id }).from(run).where(eq(run.id, SEED_KEY_RUN_ID)).limit(1),
    db.select({ id: erpResponse.id }).from(erpResponse).where(eq(erpResponse.id, seedIds.erpResponses.b1)).limit(1),
  ])

  return Boolean(runRows[0]?.id && erpRows[0]?.id)
}

async function ensureRuleId(tx: any): Promise<number> {
  const existing = await tx.select({ id: rule.id }).from(rule).orderBy(rule.id).limit(1)
  if (existing[0]?.id) return existing[0].id

  const [inserted] = await tx
    .insert(rule)
    .values({
      currentVersionId: 1,
      type: 'standard',
      status: 'aktiv',
      matchAmountMin: '0',
      matchAmountMax: '999999',
    })
    .returning({ id: rule.id })

  if (!inserted?.id) {
    throw new Error('Failed to insert seed rule')
  }
  return inserted.id
}

async function main() {
  if (await hasSeedData()) {
    console.log('[seed-dev] Seed data already present; skipping')
    return
  }

  const today = dateOnly(new Date())

  const runDates = {
    latest: daysAgo(today, 1),
    processing: daysAgo(today, 3),
    done: daysAgo(today, 5),
    failed: daysAgo(today, 7),
  }

  await db.transaction(async (tx) => {
    const seedRuleId = await ensureRuleId(tx)

    await tx
      .insert(account)
      .values([
        { id: 'DK20005908764988-DKK', name: 'Hovedkonto', statusAccount: 9999 },
        { id: 'DK20009042714507-DKK', name: 'Kreditorkonto', statusAccount: 9999 },
      ])
      .onConflictDoNothing({ target: account.id })

    await tx
      .insert(run)
      .values([
        { id: seedIds.runs.latest, bookingDate: runDates.latest, status: 'afventer' },
        { id: seedIds.runs.processing, bookingDate: runDates.processing, status: 'indlæser' },
        { id: seedIds.runs.done, bookingDate: runDates.done, status: 'udført' },
        { id: seedIds.runs.failed, bookingDate: runDates.failed, status: 'fejl' },
      ])
      .onConflictDoNothing({ target: run.id })

    await tx
      .insert(erpRequest)
      .values([
        {
          id: seedIds.erpRequests.r1,
          runId: seedIds.runs.done,
          payload: JSON.stringify({ kind: 'seed', runId: seedIds.runs.done, note: 'ERP request 1' }),
        },
        {
          id: seedIds.erpRequests.r2,
          runId: seedIds.runs.done,
          payload: JSON.stringify({ kind: 'seed', runId: seedIds.runs.done, note: 'ERP request 2' }),
        },
        {
          id: seedIds.erpRequests.r3,
          runId: seedIds.runs.latest,
          payload: JSON.stringify({ kind: 'seed', runId: seedIds.runs.latest, note: 'ERP request 3' }),
        },
      ])
      .onConflictDoNothing({ target: erpRequest.id })

    await tx
      .insert(erpResponse)
      .values([
        {
          id: seedIds.erpResponses.b1,
          requestId: seedIds.erpRequests.r1,
          statusText: 'OK',
          payload: JSON.stringify({ kind: 'seed', bilag: seedIds.erpResponses.b1 }),
        },
        {
          id: seedIds.erpResponses.b2,
          requestId: seedIds.erpRequests.r2,
          statusText: 'OK',
          payload: JSON.stringify({ kind: 'seed', bilag: seedIds.erpResponses.b2 }),
        },
        {
          id: seedIds.erpResponses.b3,
          requestId: seedIds.erpRequests.r3,
          statusText: 'OK',
          payload: JSON.stringify({ kind: 'seed', bilag: seedIds.erpResponses.b3 }),
        },
      ])
      .onConflictDoNothing({ target: erpResponse.id })

    await tx
      .insert(transaction)
      .values([
        {
          id: seedIds.transactions.t1,
          runId: seedIds.runs.done,
          accountId: 'DK20005908764988-DKK',
          amount: '-4588.42',
          currency: 'DKK',
          creditDebitIndicator: 'DBIT',
          bookingDate: runDates.done,
          bkTxCdProprietary: 'CAP',
          creditorName: 'SKAT',
          remittanceUstrd: ['NKS-KY'],
          ntryRef: 'NTRY-001',
        },
        {
          id: seedIds.transactions.t2,
          runId: seedIds.runs.done,
          accountId: 'DK20009042714507-DKK',
          amount: '5038.75',
          currency: 'DKK',
          creditDebitIndicator: 'CRDT',
          bookingDate: runDates.done,
          bkTxCdProprietary: 'BGS',
          debtorName: 'PARKMAN OY',
          remittanceUstrd: ['Parkman 08/2025', 'Kundennr: 10000322'],
          ntryRef: 'NTRY-002',
        },
        {
          id: seedIds.transactions.t3,
          runId: seedIds.runs.done,
          accountId: 'DK20005908764988-DKK',
          amount: '315.00',
          currency: 'DKK',
          creditDebitIndicator: 'CRDT',
          bookingDate: runDates.done,
          bkTxCdProprietary: 'DANKORT-SALG',
          remittanceUstrd: ['Dankort-salg 12.09 6899625 242050'],
          ntryRef: 'NTRY-003',
        },
        {
          id: seedIds.transactions.t4,
          runId: seedIds.runs.latest,
          accountId: 'DK20005908764988-DKK',
          amount: '-120.00',
          currency: 'DKK',
          creditDebitIndicator: 'DBIT',
          bookingDate: runDates.latest,
          bkTxCdDomain: 'PMNT',
          bkTxCdFamily: 'ICDT',
          bkTxCdSubFamily: 'ESCT',
          creditorName: 'Eksempel Leverandør',
          remittanceUstrd: ['Faktura 12345'],
          ntryRef: 'NTRY-004',
        },
        {
          id: seedIds.transactions.t5,
          runId: seedIds.runs.processing,
          accountId: 'DK20009042714507-DKK',
          amount: '999.00',
          currency: 'DKK',
          creditDebitIndicator: 'CRDT',
          bookingDate: runDates.processing,
          bkTxCdProprietary: 'BGS',
          debtorName: 'Eksempel Afsender',
          remittanceUstrd: ['Testoverførsel'],
          ntryRef: 'NTRY-005',
        },
      ])
      .onConflictDoNothing({ target: transaction.id })

    // Mark one as auto-booked and matched, and one as open.
    await tx
      .insert(transactionProcessing)
      .values([
        { transactionId: seedIds.transactions.t1, status: 'bogført', ruleApplied: seedRuleId },
        { transactionId: seedIds.transactions.t2, status: 'åben', ruleApplied: null },
      ])
      .onConflictDoNothing({ target: transactionProcessing.transactionId })

    await tx
      .insert(document)
      .values([
        {
          id: seedIds.documents.d1,
          runId: seedIds.runs.latest,
          type: 'afstemning',
          content: csvBase64,
          filename: `afstemning-${today.toISOString().slice(0, 10)}.csv`,
          fileExtension: 'csv',
        },
        {
          id: seedIds.documents.d2,
          runId: seedIds.runs.done,
          type: 'postering',
          content: pdfBase64,
          filename: 'postering-rapport.pdf',
          fileExtension: 'pdf',
        },
      ])
      .onConflictDoNothing({ target: document.id })

    await tx
      .insert(errorLog)
      .values([
        {
          id: seedIds.errors.e1,
          runId: seedIds.runs.latest,
          source: 'application',
          errorCode: 4099,
          errorString: 'Seed: Bankfil mangler signatur',
          createdAt: sql`now()`,
        },
        {
          id: seedIds.errors.e2,
          runId: seedIds.runs.failed,
          source: 'banking',
          errorCode: 5001,
          errorString: 'Seed: Fejl ved hentning af transaktioner fra bank',
          createdAt: sql`now()`,
        },
      ])
      .onConflictDoNothing({ target: errorLog.id })
  })

  console.log('[seed-dev] Seeded dev data')
}

main().catch((error) => {
  console.error('[seed-dev] Failed', error)
  process.exitCode = 1
})
