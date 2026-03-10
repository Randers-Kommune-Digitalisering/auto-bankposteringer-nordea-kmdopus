import { defineEventHandler, createError } from 'h3'
import { desc, eq } from 'drizzle-orm'
import db from '~/lib/db'
import { ruleVersion } from '~/lib/db/schema/ruleVersion'

export default defineEventHandler(async (event) => {
  const ruleId = Number(event.context.params?.ruleId)
  if (!ruleId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing ruleId' })
  }

  const existing = await db.query.rule.findFirst({
    where: (fields, { eq }) => eq(fields.id, ruleId),
    columns: {
      id: true,
      currentVersionId: true,
      updatedAt: true,
    },
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Rule not found' })
  }

  const versions = await db
    .select({
      version: ruleVersion.version,
      createdAt: ruleVersion.createdAt,
      content: ruleVersion.content,
    })
    .from(ruleVersion)
    .where(eq(ruleVersion.ruleId, ruleId))
    .orderBy(desc(ruleVersion.version))

  return {
    ruleId: existing.id,
    currentVersion: existing.currentVersionId,
    updatedAt: existing.updatedAt instanceof Date ? existing.updatedAt.toISOString() : existing.updatedAt,
    versions: versions.map((row) => ({
      version: row.version,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString().slice(0, 10) : String(row.createdAt ?? ''),
      content: row.content,
    })),
  }
})
