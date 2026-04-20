import 'dotenv/config'
import { inArray, or } from 'drizzle-orm'
import dns from 'node:dns/promises'

async function normalizeDatabaseUrlForLocalScripts() {
  const raw = process.env.DATABASE_URL
  if (!raw) return
  try {
    const url = new URL(raw)
    // In docker-compose, other containers can reach Postgres via hostname `db`.
    // When running scripts on the host/codespace, use the published port instead.
    if (url.hostname === 'db') {
      try {
        await dns.lookup('db')
        return
      } catch {
        url.hostname = 'localhost'
        process.env.DATABASE_URL = url.toString()
      }
    }
  } catch {
    // Ignore invalid URLs; drizzle will error with a useful message.
  }
}

await normalizeDatabaseUrlForLocalScripts()

const { default: db } = await import('../../app/lib/db')

import { run } from '../../app/lib/db/schema/run'
import { transaction, transactionProcessing } from '../../app/lib/db/schema/transaction'
import { document } from '../../app/lib/db/schema/document'
import { errorLog } from '../../app/lib/db/schema/error'
import { job } from '../../app/lib/db/schema/job'
import { outbox } from '../../app/lib/db/schema/outbox'
import { erpRequest, erpRequestLine, erpResponse } from '../../app/lib/db/schema/erp'
import { bankingDocument, bankingStatement, bankingStatementBalance } from '../../app/lib/db/schema/statement'

const seedRunIds = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
]

const seedBankingDocumentIds = [
  'aaaaaaaa-1111-4111-8111-111111111111',
  'aaaaaaaa-2222-4222-8222-222222222222',
]

const seedBankingStatementIds = [
  'bbbbbbbb-1111-4111-8111-111111111111',
  'bbbbbbbb-2222-4222-8222-222222222222',
]

const seedBankingBalanceIds = [
  'cccccccc-1111-4111-8111-111111111111',
  'cccccccc-2222-4222-8222-222222222222',
  'cccccccc-3333-4333-8333-333333333333',
  'cccccccc-4444-4444-8444-444444444444',
]

const seedTransactionIds = [
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
]

const seedDocumentIds = [
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666',
]

const seedErrorIds = [
  '77777777-7777-4777-8777-777777777777',
  '88888888-8888-4888-8888-888888888888',
]

const seedJobIds = [
  '99999999-0000-4000-8000-000000000001',
  '99999999-0000-4000-8000-000000000002',
]

const seedOutboxIds = [
  '88888888-0000-4000-8000-000000000001',
  '88888888-0000-4000-8000-000000000002',
]

const seedErpRequestIds = ['seed-erp-request-1', 'seed-erp-request-2', 'seed-erp-request-3']
const seedErpResponseIds = ['BILAG-2026-0001', 'BILAG-2026-0002', 'BILAG-2026-0003']

await db.transaction(async (trx) => {
  // Outbox + jobs first (loosely related to runs)
  await trx
    .delete(outbox)
    .where(or(
      inArray(outbox.id, seedOutboxIds as any),
      inArray(outbox.runId, seedRunIds as any),
    ))

  await trx
    .delete(job)
    .where(or(
      inArray(job.id, seedJobIds as any),
      inArray(job.runId, seedRunIds as any),
    ))

  // ERP
  await trx.delete(erpResponse).where(inArray(erpResponse.id, seedErpResponseIds as any))
  await trx.delete(erpRequestLine).where(inArray(erpRequestLine.requestId, seedErpRequestIds as any))
  await trx
    .delete(erpRequest)
    .where(or(
      inArray(erpRequest.id, seedErpRequestIds as any),
      inArray(erpRequest.runId, seedRunIds as any),
    ))

  // Transactions
  await trx
    .delete(transactionProcessing)
    .where(inArray(transactionProcessing.transactionId, seedTransactionIds as any))

  await trx
    .delete(transaction)
    .where(or(
      inArray(transaction.id, seedTransactionIds as any),
      inArray(transaction.runId, seedRunIds as any),
    ))

  // Run-scoped tables
  await trx
    .delete(document)
    .where(or(
      inArray(document.id, seedDocumentIds as any),
      inArray(document.runId, seedRunIds as any),
    ))

  await trx
    .delete(errorLog)
    .where(or(
      inArray(errorLog.id, seedErrorIds as any),
      inArray(errorLog.runId, seedRunIds as any),
    ))

  // Banking source mocks (not run-scoped)
  await trx.delete(bankingStatementBalance).where(inArray(bankingStatementBalance.id, seedBankingBalanceIds as any))
  await trx.delete(bankingStatement).where(inArray(bankingStatement.id, seedBankingStatementIds as any))
  await trx.delete(bankingDocument).where(inArray(bankingDocument.id, seedBankingDocumentIds as any))

  // Runs last
  await trx.delete(run).where(inArray(run.id, seedRunIds as any))
})

console.log('Dev seed cleanup complete:', {
  seedRunIds,
  seedTransactionIds,
  seedDocumentIds,
  seedJobIds,
  seedOutboxIds,
})
