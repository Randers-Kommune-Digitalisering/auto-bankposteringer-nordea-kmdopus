import 'dotenv/config'
import dns from 'node:dns/promises'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import tryParseEnv from '../../app/lib/try-parse-env'

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
import type { ErpSupplier } from '../../app/lib/db/schema/enums'

const TENANT_CONFIG_ID = 1

const SeedEnvSchema = z.object({
  ERP_SUPPLIER: z.string(),
})

tryParseEnv(SeedEnvSchema)
const seedEnv = SeedEnvSchema.parse(process.env)

type SeedDimension = {
  supplier: ErpSupplier
  key: string
  sortOrder: number
  required: boolean
  erpTarget?: string
}

const seedDimensions: SeedDimension[] = [
  { supplier: 'kmd', key: 'artskonto', sortOrder: 1, required: true, erpTarget: 'glAccount' },
  { supplier: 'kmd', key: 'omkostningssted', sortOrder: 2, required: false, erpTarget: 'costCenter' },
  { supplier: 'kmd', key: 'psp-element', sortOrder: 3, required: false, erpTarget: 'wbsElement' },
]

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
  for (const dim of seedDimensions) {
    await db
      .insert(erpAccountingDimensionDefinition)
      .values({
        erpSupplier: dim.supplier,
        key: dim.key,
        erpTarget: dim.erpTarget,
        sortOrder: dim.sortOrder,
        required: dim.required,
      })
      .onConflictDoNothing({
        target: [erpAccountingDimensionDefinition.erpSupplier, erpAccountingDimensionDefinition.key],
      })
  }
}

async function main() {
  const desiredSupplier = seedEnv.ERP_SUPPLIER as ErpSupplier
  await ensureTenantConfiguration(desiredSupplier)
  await ensureDimensionDefinitions()
  // eslint-disable-next-line no-console
  console.log('[seed-system] ok')
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed-system] failed', err)
  process.exitCode = 1
})
