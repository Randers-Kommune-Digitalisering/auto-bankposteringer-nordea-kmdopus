import 'dotenv/config'
import dns from 'node:dns/promises'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import tryParseEnv from '../../app/lib/env/try-parse-env'

async function normalizeDatabaseUrlForLocalScripts() {
  const raw = process.env.DATABASE_URL
  if (!raw) return
  try {
    const url = new URL(raw)
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

import { erpAccountingDimensionDefinition, tenantConfiguration } from '../../app/lib/db/schema/rule'
import { erpAccountingDimensionConstraint, erpAccountingDimensionConstraintMember } from '../../app/lib/db/schema/accountingDimensionConstraint'
import type { ErpSupplier } from '../../app/lib/db/schema/enums'
import { defaultAccountingDimensionConstraints, defaultAccountingDimensionDefinitions } from '../../engine/erp-integration/domain/accountingDimensionDefaults'

const TENANT_CONFIG_ID = 1

const SeedEnvSchema = z.object({
  ERP_SUPPLIER: z.string(),
})

tryParseEnv(SeedEnvSchema)
const seedEnv = SeedEnvSchema.parse(process.env)

async function ensureTenantConfiguration(desiredSupplier: ErpSupplier) {
  const [existing] = await db
    .select({ id: tenantConfiguration.id, activeErpSupplier: tenantConfiguration.activeErpSupplier })
    .from(tenantConfiguration)
    .where(eq(tenantConfiguration.id, TENANT_CONFIG_ID))
    .limit(1)

  if (!existing) {
    await db
      .insert(tenantConfiguration)
      .values({ id: TENANT_CONFIG_ID, activeErpSupplier: desiredSupplier })
    return
  }

  if (existing.activeErpSupplier !== desiredSupplier) {
    throw new Error(
      `ERP supplier mismatch (policy A): env=${desiredSupplier} db=${existing.activeErpSupplier}. ` +
        'Skift af ERP supplier kræver eksplicit migration/reset.',
    )
  }
}

async function ensureDimensionDefinitions() {
  // Seed definitions idempotently.
  for (const dim of defaultAccountingDimensionDefinitions) {
    await db
      .insert(erpAccountingDimensionDefinition)
      .values({
        erpSupplier: dim.supplier,
        key: dim.key,
        valueRegex: dim.valueRegex,
        valueRegexFlags: dim.valueRegexFlags,
        erpTarget: dim.erpTarget,
        sortOrder: dim.sortOrder,
        required: dim.required,
      })
      .onConflictDoNothing({
        target: [erpAccountingDimensionDefinition.erpSupplier, erpAccountingDimensionDefinition.key],
      })
  }
}

async function ensureDimensionConstraints() {
  for (const c of defaultAccountingDimensionConstraints) {
    await db
      .insert(erpAccountingDimensionConstraint)
      .values({
        erpSupplier: c.supplier,
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

    const [constraint] = await db
      .select({ id: erpAccountingDimensionConstraint.id })
      .from(erpAccountingDimensionConstraint)
      .where(and(
        eq(erpAccountingDimensionConstraint.erpSupplier, c.supplier),
        eq(erpAccountingDimensionConstraint.ifKey, c.ifKey),
        eq(erpAccountingDimensionConstraint.kind, c.kind),
        c.ifValueRegex ? eq(erpAccountingDimensionConstraint.ifValueRegex, c.ifValueRegex) : isNull(erpAccountingDimensionConstraint.ifValueRegex),
      ))
      .limit(1)

    if (!constraint?.id) continue

    for (const key of c.members) {
      await db
        .insert(erpAccountingDimensionConstraintMember)
        .values({ constraintId: constraint.id, key })
        .onConflictDoNothing({
          target: [
            erpAccountingDimensionConstraintMember.constraintId,
            erpAccountingDimensionConstraintMember.key,
          ],
        })
    }
  }
}

async function main() {
  const desiredSupplier = seedEnv.ERP_SUPPLIER as ErpSupplier
  await ensureTenantConfiguration(desiredSupplier)
  await ensureDimensionDefinitions()
  await ensureDimensionConstraints()
  // eslint-disable-next-line no-console
  console.log('[seed-system] ok')
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed-system] failed', err)
  process.exitCode = 1
})
