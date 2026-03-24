import 'dotenv/config'
import { and, eq, isNull, sql } from 'drizzle-orm'
import crypto from 'node:crypto'
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

import { account } from '../../app/lib/db/schema/account'
import { document } from '../../app/lib/db/schema/document'
import { erpRequest, erpRequestLine, erpResponse } from '../../app/lib/db/schema/erp'
import { errorLog } from '../../app/lib/db/schema/error'
import { job } from '../../app/lib/db/schema/job'
import { outbox } from '../../app/lib/db/schema/outbox'
import { run } from '../../app/lib/db/schema/run'
import {
  erpAccountingDimensionDefinition,
  // constraints are seeded in dev to ensure rule creation validates correctly
  ruleAccountingAttachment,
  ruleAccountingParameters,
  rule,
  ruleAccountingDimensionValue,
  ruleBankAccount,
  ruleBankingCondition,
  ruleRuleTag,
  tenantConfiguration,
} from '../../app/lib/db/schema/rule'
import { erpAccountingDimensionConstraint, erpAccountingDimensionConstraintMember } from '../../app/lib/db/schema/accountingDimensionConstraint'
import type { ErpSupplier } from '../../app/lib/db/schema/enums'
import { ruleTag } from '../../app/lib/db/schema/ruleTag'
import { ruleVersion } from '../../app/lib/db/schema/ruleVersion'
import { defaultAccountingDimensionConstraints, defaultAccountingDimensionDefinitions } from '../../engine/erp-integration/domain/accountingDimensionDefaults'
import {
  bankingDocument,
  bankingStatement,
  bankingStatementBalance,
} from '../../app/lib/db/schema/statement'
import { transaction, transactionProcessing } from '../../app/lib/db/schema/transaction'
import { bankingAgreement } from '../../app/lib/db/schema/bankingAgreement'

const SEED_KEY_RUN_ID = '11111111-1111-4111-8111-111111111111'

const seedIds = {
  runs: {
    latest: '11111111-1111-4111-8111-111111111111',
    processing: '22222222-2222-4222-8222-222222222222',
    done: '33333333-3333-4333-8333-333333333333',
    failed: '44444444-4444-4444-8444-444444444444',
  },
  banking: {
    doc1: 'aaaaaaaa-1111-4111-8111-111111111111',
    doc2: 'aaaaaaaa-2222-4222-8222-222222222222',
    st1: 'bbbbbbbb-1111-4111-8111-111111111111',
    st2: 'bbbbbbbb-2222-4222-8222-222222222222',
    bal1: 'cccccccc-1111-4111-8111-111111111111',
    bal2: 'cccccccc-2222-4222-8222-222222222222',
    bal3: 'cccccccc-3333-4333-8333-333333333333',
    bal4: 'cccccccc-4444-4444-8444-444444444444',
  },
  transactions: {
    t1: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    t2: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    t3: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    t4: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    t5: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  },
  documents: {
    d1: '55555555-5555-4555-8555-555555555555',
    d2: '66666666-6666-4666-8666-666666666666',
  },
  errors: {
    e1: '77777777-7777-4777-8777-777777777777',
    e2: '88888888-8888-4888-8888-888888888888',
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
  jobs: {
    j1: '99999999-0000-4000-8000-000000000001',
    j2: '99999999-0000-4000-8000-000000000002',
  },
  outbox: {
    o1: '88888888-0000-4000-8000-000000000001',
    o2: '88888888-0000-4000-8000-000000000002',
  },
  ruleVersions: {
    rv1: '77777777-0000-4000-8000-000000000001',
    rv2: '77777777-0000-4000-8000-000000000002',
    rv3: '77777777-0000-4000-8000-000000000003',
    rv4: '77777777-0000-4000-8000-000000000004',
  },
  ruleParams: {
    p1: '66666666-0000-4000-8000-000000000001',
    p2: '66666666-0000-4000-8000-000000000002',
  },
  ruleAttachments: {
    a1: '55555555-0000-4000-8000-000000000001',
  },
  ruleConditions: {
    c1: '44444444-0000-4000-8000-000000000001',
    c2: '44444444-0000-4000-8000-000000000002',
    c3: '44444444-0000-4000-8000-000000000003',
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

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

const TENANT_CONFIG_ID = 1
const erpSupplier = (process.env.ERP_SUPPLIER ?? 'kmd') as ErpSupplier

async function ensureTenantConfiguration(tx: any) {
  const existing = await tx
    .select({ id: tenantConfiguration.id, activeErpSupplier: tenantConfiguration.activeErpSupplier })
    .from(tenantConfiguration)
    .where(eq(tenantConfiguration.id, TENANT_CONFIG_ID))
    .limit(1)

  if (!existing[0]) {
    await tx
      .insert(tenantConfiguration)
      .values({ id: TENANT_CONFIG_ID, activeErpSupplier: erpSupplier })
    return
  }

  if (existing[0].activeErpSupplier !== erpSupplier) {
    throw new Error(
      `ERP supplier mismatch (policy A): env=${erpSupplier} db=${existing[0].activeErpSupplier}. ` +
        'Reset DB/seed explicitly to switch supplier.',
    )
  }
}

async function ensureDimensionDefinitions(tx: any) {
  // Seed known dimensions for KMD. Other suppliers must add their own seed logic.
  if (erpSupplier !== 'kmd') return

  const dims = defaultAccountingDimensionDefinitions.filter(d => d.supplier === erpSupplier)
  for (const d of dims) {
    await tx
      .insert(erpAccountingDimensionDefinition)
      .values({
        erpSupplier,
        key: d.key,
        erpTarget: d.erpTarget,
        sortOrder: d.sortOrder,
        required: d.required,
        valueRegex: d.valueRegex,
        valueRegexFlags: d.valueRegexFlags,
      })
      .onConflictDoNothing({
        target: [erpAccountingDimensionDefinition.erpSupplier, erpAccountingDimensionDefinition.key],
      })
  }
}

async function ensureDimensionConstraints(tx: any) {
  if (erpSupplier !== 'kmd') return

  const constraints = defaultAccountingDimensionConstraints.filter(c => c.supplier === erpSupplier)
  for (const c of constraints) {
    await tx
      .insert(erpAccountingDimensionConstraint)
      .values({
        erpSupplier,
        ifKey: c.ifKey,
        kind: c.kind,
        ifValueRegex: c.ifValueRegex ?? null,
      })
      .onConflictDoNothing({
        target: [
          erpAccountingDimensionConstraint.erpSupplier,
          erpAccountingDimensionConstraint.ifKey,
          erpAccountingDimensionConstraint.kind,
          erpAccountingDimensionConstraint.ifValueRegex,
        ],
      })

    const [row] = await tx
      .select({ id: erpAccountingDimensionConstraint.id })
      .from(erpAccountingDimensionConstraint)
      .where(and(
        eq(erpAccountingDimensionConstraint.erpSupplier, erpSupplier),
        eq(erpAccountingDimensionConstraint.ifKey, c.ifKey),
        eq(erpAccountingDimensionConstraint.kind, c.kind),
        c.ifValueRegex ? eq(erpAccountingDimensionConstraint.ifValueRegex, c.ifValueRegex) : isNull(erpAccountingDimensionConstraint.ifValueRegex),
      ))
      .limit(1)

    if (!row?.id) continue

    for (const key of c.members) {
      await tx
        .insert(erpAccountingDimensionConstraintMember)
        .values({ constraintId: row.id, key })
        .onConflictDoNothing({
          target: [
            erpAccountingDimensionConstraintMember.constraintId,
            erpAccountingDimensionConstraintMember.key,
          ],
        })
    }
  }
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
      erpSupplier,
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
  const shouldReset = process.env.SEED_DEV_RESET === '1'
  if (await hasSeedData()) {
    if (!shouldReset) {
      console.log('[seed-dev] Seed data already present; ensuring all seed rows exist (set SEED_DEV_RESET=1 to reset)')
    } else {
      console.log('[seed-dev] Reset requested (SEED_DEV_RESET=1); reseeding')
    }
  }

  const today = dateOnly(new Date())

  const runDates = {
    latest: daysAgo(today, 1),
    processing: daysAgo(today, 3),
    done: daysAgo(today, 5),
    failed: daysAgo(today, 7),
  }

  await db.transaction(async (tx) => {
    if (shouldReset) {
      // Keep scope limited to tables we seed; CASCADE handles FK order.
      await tx.execute(
        sql.raw(`
          truncate table
            "banking_agreement_cursor",
            "banking_agreement",
            "erp_response",
            "erp_request_line",
            "erp_request",
            "outbox",
            "job",
            "error",
            "document",
            "transaction_processing",
            "transaction",
            "banking_statement_balance",
            "banking_statement",
            "banking_document",
            "kmd_attachment",
            "kmd_accounting_parameters",
            "rule_banking_condition",
            "rule_rule_tag",
            "rule_bank_account",
            "rule_version",
            "rule_tag",
            "rule",
            "run",
            "account"
          restart identity cascade;
        `),
      )
    }

    await ensureTenantConfiguration(tx)
    await ensureDimensionDefinitions(tx)
    await ensureDimensionConstraints(tx)

    const seedRuleId = await ensureRuleId(tx)

    await tx
      .insert(bankingAgreement)
      .values([
        { provider: 'danskebank', enabled: false },
        { provider: 'nordea', enabled: false },
        { provider: 'bankconnect', enabled: false },
      ])
      .onConflictDoNothing({ target: bankingAgreement.provider })

    await tx
      .insert(account)
      .values([
        { id: 'DK20005908764988-DKK', name: 'Hovedkonto', provider: 'nordea', statusAccount: 9999 },
        { id: 'DK20009042714507-DKK', name: 'Kreditorkonto', provider: 'nordea', statusAccount: 9999 },
        { id: 'DK50004004401162-DKK', name: 'Udbetalinger', provider: 'nordea', statusAccount: 9999 },
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

    // Banking source (document -> statement -> balances) to make ingestion linkage realistic.
    const camtMock1 = `<?xml version="1.0" encoding="UTF-8"?>\n<Document><Mock>camt053 seed 1</Mock></Document>`
    const camtMock2 = `<?xml version="1.0" encoding="UTF-8"?>\n<Document><Mock>camt053 seed 2</Mock></Document>`

    await tx
      .insert(bankingDocument)
      .values([
        {
          id: seedIds.banking.doc1,
          accountId: 'DK20005908764988-DKK',
          format: 'camt053',
          filename: `camt053-${runDates.done.toISOString().slice(0, 10)}.xml`,
          content: camtMock1,
          contentHash: sha256(camtMock1),
          messageId: 'SEED-MSG-001',
        },
        {
          id: seedIds.banking.doc2,
          accountId: 'DK20009042714507-DKK',
          format: 'camt053',
          filename: `camt053-${runDates.latest.toISOString().slice(0, 10)}.xml`,
          content: camtMock2,
          contentHash: sha256(camtMock2),
          messageId: 'SEED-MSG-002',
        },
      ])
        .onConflictDoNothing({ target: bankingDocument.id })

    await tx
      .insert(bankingStatement)
      .values([
        {
          id: seedIds.banking.st1,
          documentId: seedIds.banking.doc1,
          statementId: 'SEED-STMT-001',
          electronicSeqNo: 42,
          iban: 'DK20005908764988',
          currency: 'DKK',
          ownerName: 'Randers Kommune',
          fromDate: runDates.done,
          toDate: runDates.done,
        },
        {
          id: seedIds.banking.st2,
          documentId: seedIds.banking.doc2,
          statementId: 'SEED-STMT-002',
          electronicSeqNo: 43,
          iban: 'DK20009042714507',
          currency: 'DKK',
          ownerName: 'Randers Kommune',
          fromDate: runDates.latest,
          toDate: runDates.latest,
        },
      ])
      .onConflictDoNothing({ target: bankingStatement.id })

    await tx
      .insert(bankingStatementBalance)
      .values([
        {
          id: seedIds.banking.bal1,
          statementId: seedIds.banking.st1,
          typeCode: 'OPBD',
          amount: '100000.00',
          currency: 'DKK',
          creditDebitIndicator: 'CRDT',
          balanceDate: runDates.done,
        },
        {
          id: seedIds.banking.bal2,
          statementId: seedIds.banking.st1,
          typeCode: 'CLBD',
          amount: '95411.58',
          currency: 'DKK',
          creditDebitIndicator: 'CRDT',
          balanceDate: runDates.done,
        },
        {
          id: seedIds.banking.bal3,
          statementId: seedIds.banking.st2,
          typeCode: 'OPBD',
          amount: '25000.00',
          currency: 'DKK',
          creditDebitIndicator: 'CRDT',
          balanceDate: runDates.latest,
        },
        {
          id: seedIds.banking.bal4,
          statementId: seedIds.banking.st2,
          typeCode: 'CLBD',
          amount: '24880.00',
          currency: 'DKK',
          creditDebitIndicator: 'CRDT',
          balanceDate: runDates.latest,
        },
      ])
      .onConflictDoNothing({ target: bankingStatementBalance.id })

    await tx
      .insert(erpRequest)
      .values([
        {
          id: seedIds.erpRequests.r1,
          runId: seedIds.runs.done,
          payload: `<ErpRequest id="${seedIds.erpRequests.r1}"><Line no="1"/><Line no="2"/></ErpRequest>`,
        },
        {
          id: seedIds.erpRequests.r2,
          runId: seedIds.runs.done,
          payload: `<ErpRequest id="${seedIds.erpRequests.r2}"><Line no="1"/><Line no="2"/><Line no="3"/></ErpRequest>`,
        },
        {
          id: seedIds.erpRequests.r3,
          runId: seedIds.runs.latest,
          payload: `<ErpRequest id="${seedIds.erpRequests.r3}"><Line no="1"/></ErpRequest>`,
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
          payload: `<ErpResponse requestId="${seedIds.erpRequests.r1}" status="OK"/>`,
        },
        {
          id: seedIds.erpResponses.b2,
          requestId: seedIds.erpRequests.r2,
          statusText: 'AFVIST: Ugyldig kombination af artskonto/omkostningssted',
          payload: `<ErpResponse requestId="${seedIds.erpRequests.r2}" status="AFVIST"/>`,
        },
        {
          id: seedIds.erpResponses.b3,
          requestId: seedIds.erpRequests.r3,
          statusText: 'AFVIST: Kontostreng findes ikke',
          payload: `<ErpResponse requestId="${seedIds.erpRequests.r3}" status="AFVIST"/>`,
        },
      ])
      .onConflictDoNothing({ target: erpResponse.id })

    await tx
      .insert(outbox)
      .values([
        {
          id: seedIds.outbox.o1,
          topic: 'erp.uploadRequestPayload',
          runId: seedIds.runs.latest,
          dedupeKey: `seed:erp.upload:${seedIds.erpRequests.r3}`,
          payload: { requestId: seedIds.erpRequests.r3, filename: `${seedIds.erpRequests.r3}.xml`, lineCount: 1 },
          status: 'failed',
          attempts: 3,
          // Keep as failed for UI, but do not let the worker retry in dev by default.
          nextAttemptAt: sql`now() + interval '100 years'`,
          lastError: 'Seed: SFTP timeout',
        },
      ])
      .onConflictDoNothing({ target: outbox.id })

    // If older seed runs inserted retryable outbox items (or used unknown topics), park them.
    await tx.execute(sql`
      update outbox
      set next_attempt_at = now() + interval '100 years'
      where id in (${seedIds.outbox.o1}, ${seedIds.outbox.o2})
         or topic = 'notification.email.requested'
    `)

    await tx
      .insert(job)
      .values([
        {
          id: seedIds.jobs.j1,
          type: 'banking.ingest',
          status: 'failed',
          runId: seedIds.runs.failed,
          payload: { accountId: 'DK20005908764988-DKK', note: 'Seed job' },
          attempts: 2,
          maxAttempts: 10,
          runAt: sql`now()`,
          lastError: 'Seed: Bank API returned 500',
        },
        {
          id: seedIds.jobs.j2,
          type: 'erp.ingestResponses',
          status: 'failed',
          runId: seedIds.runs.done,
          payload: { note: 'Seed job' },
          attempts: 1,
          maxAttempts: 10,
          runAt: sql`now()`,
          lastError: 'Seed: Could not parse ERP response file',
        },
      ])
      .onConflictDoNothing({ target: job.id })

    await tx
      .insert(transaction)
      .values([
        {
          id: seedIds.transactions.t1,
          runId: seedIds.runs.done,
          accountId: 'DK20005908764988-DKK',
          statementId: seedIds.banking.st1,
          entryIndex: 1,
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
          statementId: seedIds.banking.st1,
          entryIndex: 2,
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
          statementId: seedIds.banking.st1,
          entryIndex: 3,
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
          statementId: seedIds.banking.st2,
          entryIndex: 1,
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
          statementId: seedIds.banking.st2,
          entryIndex: 2,
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

    // Line-level linkage requires transactions to exist (FK).
    await tx
      .insert(erpRequestLine)
      .values([
        { requestId: seedIds.erpRequests.r1, lineNo: 1, transactionId: seedIds.transactions.t1 },
        { requestId: seedIds.erpRequests.r1, lineNo: 2, transactionId: seedIds.transactions.t2 },
        { requestId: seedIds.erpRequests.r2, lineNo: 1, transactionId: seedIds.transactions.t3 },
        { requestId: seedIds.erpRequests.r2, lineNo: 2, transactionId: seedIds.transactions.t1 },
        { requestId: seedIds.erpRequests.r2, lineNo: 3, transactionId: null },
        { requestId: seedIds.erpRequests.r3, lineNo: 1, transactionId: seedIds.transactions.t4 },
      ])
      .onConflictDoNothing({ target: [erpRequestLine.requestId, erpRequestLine.lineNo] })

    // Mark one as auto-booked and matched, and one as open.
    await tx
      .insert(transactionProcessing)
      .values([
        { transactionId: seedIds.transactions.t1, status: 'bogført', ruleApplied: seedRuleId },
        { transactionId: seedIds.transactions.t2, status: 'åben', ruleApplied: null },
        { transactionId: seedIds.transactions.t3, status: 'undtaget', ruleApplied: null },
        { transactionId: seedIds.transactions.t4, status: 'bogført', ruleApplied: seedRuleId },
        { transactionId: seedIds.transactions.t5, status: 'åben', ruleApplied: null },
      ])
      .onConflictDoNothing({ target: transactionProcessing.transactionId })

    // Rule tags + basic rule metadata, versions, and accounting parameters.
    await tx
      .insert(ruleTag)
      .values([{ id: 'skat' }, { id: 'kreditor' }, { id: 'dankort' }])
      .onConflictDoNothing({ target: ruleTag.id })

    // Ensure we have at least two rules for more realistic UI.
    const existingRules = await tx.select({ id: rule.id }).from(rule).orderBy(rule.id)
    let ruleId1 = existingRules[0]?.id ?? seedRuleId
    let ruleId2 = existingRules[1]?.id
    if (!ruleId2) {
      const [created] = await tx
        .insert(rule)
        .values({
          currentVersionId: 1,
          erpSupplier,
          type: 'standard',
          status: 'aktiv',
          matchAmountMin: '0',
          matchAmountMax: '999999',
        })
        .returning({ id: rule.id })
      ruleId2 = created?.id
    }
    if (!ruleId2) ruleId2 = ruleId1

    // Keep rules tied to accounts and tags.
    await tx
      .insert(ruleBankAccount)
      .values([
        { ruleId: ruleId1, bankAccountId: 'DK20005908764988-DKK' },
        { ruleId: ruleId2, bankAccountId: 'DK20009042714507-DKK' },
      ])
      .onConflictDoNothing({ target: [ruleBankAccount.ruleId, ruleBankAccount.bankAccountId] })

    await tx
      .insert(ruleRuleTag)
      .values([
        { ruleId: ruleId1, ruleTagId: 'skat' },
        { ruleId: ruleId2, ruleTagId: 'kreditor' },
      ])
      .onConflictDoNothing({ target: [ruleRuleTag.ruleId, ruleRuleTag.ruleTagId] })

    await tx
      .insert(ruleBankingCondition)
      .values([
        { id: seedIds.ruleConditions.c1, ruleId: ruleId1, field: 'cdtr_name', operator: 'ilike', value: '%SKAT%' },
        { id: seedIds.ruleConditions.c2, ruleId: ruleId2, field: 'dbtr_name', operator: 'ilike', value: '%PARKMAN%' },
        { id: seedIds.ruleConditions.c3, ruleId: ruleId2, field: 'rmt_ustrd', operator: 'ilike', value: '%Kundennr:%' },
      ])
      .onConflictDoNothing({ target: ruleBankingCondition.id })

    await tx
      .insert(ruleAccountingParameters)
      .values([
        {
          id: seedIds.ruleParams.p1,
          ruleId: ruleId1,
          bookingText: 'SKAT - seed',
          cprType: 'ingen',
          cprNumber: null,
          notifyTo: 'bogholderi@example.dk',
          note: 'Seed: automatisk match for SKAT',
        },
        {
          id: seedIds.ruleParams.p2,
          ruleId: ruleId2,
          bookingText: 'Kreditorbetaling - seed',
          cprType: 'ingen',
          cprNumber: null,
          notifyTo: '',
          note: 'Seed: kreditorbetalinger',
        },
      ])
      .onConflictDoNothing({ target: ruleAccountingParameters.id })

    // Persist per-rule accounting dimension values
    if (erpSupplier === 'kmd') {
      const defs = await tx
        .select({ id: erpAccountingDimensionDefinition.id, key: erpAccountingDimensionDefinition.key })
        .from(erpAccountingDimensionDefinition)
        .where(eq(erpAccountingDimensionDefinition.erpSupplier, erpSupplier))

      const byKey = new Map(defs.map((d: any) => [String(d.key), String(d.id)]))
      const artskontoId = byKey.get('artskonto')
      const omkostningsstedId = byKey.get('omkostningssted')
      const pspElementId = byKey.get('psp-element')

      if (artskontoId) {
        await tx
          .insert(ruleAccountingDimensionValue)
          .values([
            { ruleId: ruleId1, definitionId: artskontoId, value: '95999999' },
            { ruleId: ruleId2, definitionId: artskontoId, value: '12000000' },
          ])
          .onConflictDoNothing({
            target: [ruleAccountingDimensionValue.ruleId, ruleAccountingDimensionValue.definitionId],
          })
      }

      if (omkostningsstedId) {
        await tx
          .insert(ruleAccountingDimensionValue)
          .values([
            { ruleId: ruleId1, definitionId: omkostningsstedId, value: '0001' },
            { ruleId: ruleId2, definitionId: omkostningsstedId, value: '0002' },
          ])
          .onConflictDoNothing({
            target: [ruleAccountingDimensionValue.ruleId, ruleAccountingDimensionValue.definitionId],
          })
      }

      // psp-element intentionally left blank in seed
      void pspElementId
    }

    await tx
      .insert(ruleAccountingAttachment)
      .values([
        {
          id: seedIds.ruleAttachments.a1,
          parameterId: seedIds.ruleParams.p1,
          name: 'seed-bilag',
          fileExtension: 'pdf',
          data: pdfBase64,
        },
      ])
      .onConflictDoNothing({ target: ruleAccountingAttachment.id })

    await tx
      .insert(ruleVersion)
      .values([
        {
          id: seedIds.ruleVersions.rv1,
          ruleId: ruleId1,
          version: 1,
          createdAt: runDates.failed,
          content: {
            type: 'standard',
            status: 'aktiv',
            matchAmountMin: -10000,
            matchAmountMax: -1,
            relatedBankAccounts: ['DK20005908764988-DKK'],
            ruleTags: ['skat'],
            matches: [{ category: 'counterparty', value: 'SKAT', operator: 'ilike', gate: 'ELLER' }],
            accounting: {
              dimensions: [
                { key: 'artskonto', value: '95999999' },
                { key: 'omkostningssted', value: '0001' },
              ],
              bookingText: 'SKAT - seed',
              cprType: 'ingen',
              cprNumber: null,
              notifyTo: 'bogholderi@example.dk',
              note: 'Seed version 1',
              attachments: [{ name: 'seed-bilag', fileExtension: 'pdf', data: pdfBase64 }],
            },
          },
        },
        {
          id: seedIds.ruleVersions.rv2,
          ruleId: ruleId1,
          version: 2,
          createdAt: runDates.done,
          content: {
            type: 'standard',
            status: 'aktiv',
            matchAmountMin: -20000,
            matchAmountMax: -1,
            relatedBankAccounts: ['DK20005908764988-DKK'],
            ruleTags: ['skat'],
            matches: [{ category: 'counterparty', value: 'SKAT', operator: 'ilike', gate: 'ELLER' }],
            accounting: {
              dimensions: [
                { key: 'artskonto', value: '95999999' },
                { key: 'omkostningssted', value: '0001' },
              ],
              bookingText: 'SKAT (udvidet) - seed',
              cprType: 'ingen',
              cprNumber: null,
              notifyTo: 'bogholderi@example.dk',
              note: 'Seed version 2',
              attachments: [{ name: 'seed-bilag', fileExtension: 'pdf', data: pdfBase64 }],
            },
          },
        },
        {
          id: seedIds.ruleVersions.rv3,
          ruleId: ruleId2,
          version: 1,
          createdAt: runDates.processing,
          content: {
            type: 'standard',
            status: 'aktiv',
            matchAmountMin: 0,
            matchAmountMax: 100000,
            relatedBankAccounts: ['DK20009042714507-DKK'],
            ruleTags: ['kreditor'],
            matches: [{ category: 'counterparty', value: 'PARKMAN', operator: 'ilike', gate: 'ELLER' }],
            accounting: {
              dimensions: [
                { key: 'artskonto', value: '12000000' },
                { key: 'omkostningssted', value: '0002' },
              ],
              bookingText: 'Kreditorbetaling - seed',
              cprType: 'ingen',
              cprNumber: null,
              notifyTo: '',
              note: 'Seed version 1',
              attachments: [],
            },
          },
        },
        {
          id: seedIds.ruleVersions.rv4,
          ruleId: ruleId2,
          version: 2,
          createdAt: runDates.latest,
          content: {
            type: 'standard',
            status: 'aktiv',
            matchAmountMin: 0,
            matchAmountMax: 200000,
            relatedBankAccounts: ['DK20009042714507-DKK'],
            ruleTags: ['kreditor'],
            matches: [{ category: 'text', value: 'Kundennr', operator: 'ilike', gate: 'ELLER' }],
            accounting: {
              dimensions: [
                { key: 'artskonto', value: '12000000' },
                { key: 'omkostningssted', value: '0002' },
              ],
              bookingText: 'Kreditorbetaling (udvidet) - seed',
              cprType: 'ingen',
              cprNumber: null,
              notifyTo: '',
              note: 'Seed version 2',
              attachments: [],
            },
          },
        },
      ])
      .onConflictDoNothing({ target: ruleVersion.id })

    // Keep rule current version aligned with seeded history.
    await tx
      .update(rule)
      .set({ currentVersionId: 2 })
      .where(eq(rule.id, ruleId1))
    await tx
      .update(rule)
      .set({ currentVersionId: 2 })
      .where(eq(rule.id, ruleId2))

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
        {
          id: '99999999-8888-7777-6666-555555555555',
          runId: seedIds.runs.done,
          source: 'erp',
          errorCode: 7001,
          errorString: 'Seed: ERP afviste en eller flere posteringer',
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
