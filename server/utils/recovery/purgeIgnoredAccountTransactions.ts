import { eq, inArray, sql } from 'drizzle-orm'
import db from '~/lib/db'
import { erpRequestLine } from '~/lib/db/schema/erp'
import { manualBookingDraft } from '~/lib/db/schema/manualBookingDraft'
import { transaction, transactionProcessing } from '~/lib/db/schema/transaction'

type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export async function purgeIgnoredAccountTransactions(trx: DatabaseTransaction, accountId: string): Promise<void> {
  const accountTxRows = await trx
    .select({ id: transaction.id })
    .from(transaction)
    .where(eq(transaction.accountId, accountId))

  const accountTxIds = accountTxRows.map(row => row.id)
  if (accountTxIds.length > 0) {
    await trx.delete(transactionProcessing).where(inArray(transactionProcessing.transactionId, accountTxIds))
    await trx.delete(manualBookingDraft).where(inArray(manualBookingDraft.transactionId, accountTxIds))
    await trx.delete(erpRequestLine).where(inArray(erpRequestLine.transactionId, accountTxIds))
    await trx.delete(transaction).where(inArray(transaction.id, accountTxIds))
  }

  await trx.execute(sql`
    delete from banking_statement_balance b
    where exists (
      select 1
      from banking_statement s
      where s.id = b.statement_id
        and not exists (
          select 1 from "transaction" t where t.statement_id = s.id
        )
    )
  `)

  await trx.execute(sql`
    delete from banking_statement s
    where not exists (
      select 1 from "transaction" t where t.statement_id = s.id
    )
  `)

  await trx.execute(sql`
    delete from banking_document d
    where not exists (
      select 1 from banking_statement s where s.document_id = d.id
    )
  `)
}