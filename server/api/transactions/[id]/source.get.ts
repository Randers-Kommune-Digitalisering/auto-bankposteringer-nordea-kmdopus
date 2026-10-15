import { eq } from 'drizzle-orm'
import { createError, defineEventHandler } from 'h3'
import { z } from 'zod'
import db from '~/lib/db'
import { bankingDocument, bankingStatement } from '~/lib/db/schema/statement'
import { transaction } from '~/lib/db/schema/transaction'
import { requireAnyAppRole } from '~~/server/auth/requireAppRoles'
import { buildCamt053SourceTree } from '~~/server/utils/banking/camt053SourceTree'

const statementReadRoles = ['bookkeeper', 'admin', 'rule_admin', 'dev'] as const

export default defineEventHandler(async (event) => {
  await requireAnyAppRole(event, statementReadRoles)

  const parsedId = z.string().uuid().safeParse(event.context.params?.id)
  if (!parsedId.success) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldigt transaktions-id' })
  }

  const [source] = await db
    .select({
      statementId: bankingStatement.statementId,
      entryIndex: transaction.entryIndex,
      entrySubIndex: transaction.entrySubIndex,
      format: bankingDocument.format,
      content: bankingDocument.content,
    })
    .from(transaction)
    .innerJoin(bankingStatement, eq(transaction.statementId, bankingStatement.id))
    .innerJoin(bankingDocument, eq(bankingStatement.documentId, bankingDocument.id))
    .where(eq(transaction.id, parsedId.data))
    .limit(1)

  if (!source || source.format !== 'camt053') {
    throw createError({ statusCode: 404, statusMessage: 'Kildedokument blev ikke fundet' })
  }

  const tree = buildCamt053SourceTree({
    xml: source.content,
    statementId: source.statementId,
    entryIndex: source.entryIndex,
    entrySubIndex: source.entrySubIndex,
  })

  if (!tree) {
    throw createError({ statusCode: 404, statusMessage: 'Transaktionen blev ikke fundet i kildedokumentet' })
  }

  return {
    statementId: source.statementId,
    entryIndex: source.entryIndex,
    entrySubIndex: source.entrySubIndex,
    tree,
  }
})