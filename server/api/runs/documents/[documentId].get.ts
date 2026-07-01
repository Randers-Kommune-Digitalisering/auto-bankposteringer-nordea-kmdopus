import { eq } from 'drizzle-orm'
import { createError, defineEventHandler } from 'h3'
import db from '~/lib/db'
import { document } from '~/lib/db/schema/document'
import { inferMimeType } from '~~/utils/function'

export default defineEventHandler(async (event) => {
  const documentId = String(event.context.params?.documentId ?? '')
  if (!documentId) {
    throw createError({ statusCode: 400, statusMessage: 'Mangler documentId' })
  }

  const row = await db
    .select({
      id: document.id,
      filename: document.filename,
      fileExtension: document.fileExtension,
      content: document.content,
    })
    .from(document)
    .where(eq(document.id, documentId))
    .limit(1)
    .then((rows) => rows[0] ?? null)

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Dokument ikke fundet' })
  }

  return {
    ...row,
    mimeType: inferMimeType(row.fileExtension, row.filename),
  }
})
