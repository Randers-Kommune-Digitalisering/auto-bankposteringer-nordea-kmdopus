import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import {
  bankingDocument,
  bankingStatement,
  bankingStatementBalance,
} from '../../../app/lib/db/schema/statement'
import { transaction } from '../../../app/lib/db/schema/transaction'
import { parseCamt053Xml } from './camt053/parseCamt053Xml'

type DbClient = {
  select: any
  insert: any
}

type IngestCamt053DocumentInput = {
  runId: string
  accountId: string
  filename?: string | null
  xml: string
}

export async function ingestCamt053Document(
  db: DbClient,
  input: IngestCamt053DocumentInput,
): Promise<{
  documentId: string
  insertedStatements: number
  insertedBalances: number
  insertedTransactions: number
  deduplicated: boolean
}> {
  const xml = input.xml
  const contentHash = crypto.createHash('sha256').update(xml, 'utf8').digest('hex')

  const existing = await db
    .select({ id: bankingDocument.id })
    .from(bankingDocument)
    .where(eq(bankingDocument.contentHash, contentHash))
    .limit(1)

  if (existing.length) {
    return {
      documentId: existing[0]!.id,
      insertedStatements: 0,
      insertedBalances: 0,
      insertedTransactions: 0,
      deduplicated: true,
    }
  }

  const parsed = parseCamt053Xml(xml)
  const messageId = parsed.messageId
  const createdAt = parsed.createdAt

  const insertedDocument = await db
    .insert(bankingDocument)
    .values({
      accountId: input.accountId,
      format: 'camt053',
      filename: input.filename ?? null,
      content: xml,
      contentHash,
      messageId,
      createdAt,
    })
    .returning({ id: bankingDocument.id })

  const documentId = insertedDocument[0]!.id

  let insertedStatements = 0
  let insertedBalances = 0
  let insertedTransactions = 0

  for (const stmt of parsed.statements) {
    const statementInsert = await db
      .insert(bankingStatement)
      .values({
        documentId,
        statementId: stmt.statementId,
        electronicSeqNo: stmt.electronicSeqNo,
        legalSeqNo: stmt.legalSeqNo,
        statementCreatedAt: stmt.statementCreatedAt,
        iban: stmt.iban,
        currency: stmt.currency,
        ownerName: stmt.ownerName,
        servicerBic: stmt.servicerBic,
        fromDate: stmt.fromDate,
        toDate: stmt.toDate,
      })
      .returning({ id: bankingStatement.id })

    const statementRowId = statementInsert[0]!.id
    insertedStatements += 1

    for (const bal of stmt.balances) {
      await db.insert(bankingStatementBalance).values({
        statementId: statementRowId,
        typeCode: bal.typeCode,
        amount: bal.amount,
        currency: bal.currency,
        creditDebitIndicator: (bal.creditDebitIndicator ?? null) as any,
        balanceDate: bal.balanceDate,
      })
      insertedBalances += 1
    }

    for (const tx of stmt.transactions) {
      await db.insert(transaction).values({
        runId: input.runId,
        accountId: input.accountId,
        statementId: statementRowId,
        entryIndex: tx.entryIndex,
        entrySubIndex: tx.entrySubIndex,
        amount: tx.amount,
        currency: tx.currency,
        creditDebitIndicator: (tx.creditDebitIndicator ?? null) as any,
        status: tx.status,
        bookingDate: tx.bookingDate,
        valueDate: tx.valueDate,
        ntryRef: tx.ntryRef,
        ntryAcctSvcrRef: tx.ntryAcctSvcrRef,
        entryAdditionalInfo: tx.entryAdditionalInfo,
        txAcctSvcrRef: tx.txAcctSvcrRef,
        refsEndToEndId: tx.refsEndToEndId,
        refsInstrId: tx.refsInstrId,
        refsPmtInfId: tx.refsPmtInfId,
        uetr: tx.uetr,
        txAdditionalInfo: tx.txAdditionalInfo,
        bkTxCdDomain: tx.bkTxCdDomain,
        bkTxCdFamily: tx.bkTxCdFamily,
        bkTxCdSubFamily: tx.bkTxCdSubFamily,
        bkTxCdProprietary: tx.bkTxCdProprietary,
        debtorName: tx.debtorName,
        debtorId: tx.debtorId,
        debtorAccountIban: tx.debtorAccountIban,
        creditorName: tx.creditorName,
        creditorId: tx.creditorId,
        creditorAccountIban: tx.creditorAccountIban,
        ultimateDebtorName: tx.ultimateDebtorName,
        ultimateCreditorName: tx.ultimateCreditorName,
        remittanceUstrd: tx.remittanceUstrd.length ? tx.remittanceUstrd : null,
        remittanceCreditorReference: tx.remittanceCreditorReference,
        remittanceAdditional: tx.remittanceAdditional.length ? tx.remittanceAdditional : null,
      })
      insertedTransactions += 1
    }
  }

  return {
    documentId,
    insertedStatements,
    insertedBalances,
    insertedTransactions,
    deduplicated: false,
  }
}
