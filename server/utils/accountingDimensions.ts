import { eq } from 'drizzle-orm'
import db from '~/lib/db'
import env from '~/lib/env'
import {
  erpAccountingDimensionDefinition,
  ruleAccountingDimensionValue,
  tenantConfiguration,
} from '~/lib/db/schema/rule'
import { accountingDimensionFormatHint } from '~/lib/presenters/accountingDimensionFormatHints'
import {
  erpAccountingDimensionConstraint,
  erpAccountingDimensionConstraintMember,
  type AccountingDimensionConstraintKind,
} from '~/lib/db/schema/accountingDimensionConstraint'
import type { ErpSupplier } from '~/lib/db/schema/enums'
import { validateAccountingDimensionConstraints } from '~~/engine/erp-integration/domain/accountingDimensionConstraints'

const TENANT_CONFIG_ID = 1

export async function getActiveErpSupplier(): Promise<ErpSupplier> {
  const [row] = await db
    .select({ activeErpSupplier: tenantConfiguration.activeErpSupplier })
    .from(tenantConfiguration)
    .where(eq(tenantConfiguration.id, TENANT_CONFIG_ID))
    .limit(1)

  return (row?.activeErpSupplier ?? env.ERP_SUPPLIER) as ErpSupplier
}

export type AccountingDimensionDefinition = {
  id: string
  key: string
  required: boolean
  sortOrder: number
  erpTarget: string | null
  valueRegex: string | null
  valueRegexFlags: string | null
}

export type AccountingDimensionConstraint = {
  id: string
  ifKey: string
  kind: AccountingDimensionConstraintKind
  members: string[]
  ifValueRegex: string | null
}

export async function listAccountingDimensionDefinitions(supplier: ErpSupplier): Promise<AccountingDimensionDefinition[]> {
  const rows = await db
    .select({
      id: erpAccountingDimensionDefinition.id,
      key: erpAccountingDimensionDefinition.key,
      required: erpAccountingDimensionDefinition.required,
      sortOrder: erpAccountingDimensionDefinition.sortOrder,
      erpTarget: erpAccountingDimensionDefinition.erpTarget,
      valueRegex: erpAccountingDimensionDefinition.valueRegex,
      valueRegexFlags: erpAccountingDimensionDefinition.valueRegexFlags,
    })
    .from(erpAccountingDimensionDefinition)
    .where(eq(erpAccountingDimensionDefinition.erpSupplier, supplier))

  return rows.sort((a, b) => (a.sortOrder - b.sortOrder) || a.key.localeCompare(b.key))
}

export async function listAccountingDimensionConstraints(supplier: ErpSupplier): Promise<AccountingDimensionConstraint[]> {
  const rows = await db
    .select({
      id: erpAccountingDimensionConstraint.id,
      ifKey: erpAccountingDimensionConstraint.ifKey,
      kind: erpAccountingDimensionConstraint.kind,
      ifValueRegex: erpAccountingDimensionConstraint.ifValueRegex,
      memberKey: erpAccountingDimensionConstraintMember.key,
    })
    .from(erpAccountingDimensionConstraint)
    .leftJoin(
      erpAccountingDimensionConstraintMember,
      eq(erpAccountingDimensionConstraintMember.constraintId, erpAccountingDimensionConstraint.id),
    )
    .where(eq(erpAccountingDimensionConstraint.erpSupplier, supplier))

  const byId = new Map<string, AccountingDimensionConstraint>()
  for (const r of rows) {
    const id = r.id
    if (!byId.has(id)) {
      byId.set(id, { id, ifKey: r.ifKey, kind: r.kind, ifValueRegex: r.ifValueRegex ?? null, members: [] })
    }
    if (r.memberKey) {
      byId.get(id)!.members.push(r.memberKey)
    }
  }

  return Array.from(byId.values())
    .map((c) => ({ ...c, members: c.members.sort((a, b) => a.localeCompare(b)) }))
    .sort((a, b) => (a.ifKey.localeCompare(b.ifKey) || a.kind.localeCompare(b.kind)))
}

export type AccountingDimensionInput = { key: string; value: string }

export function normalizeDimensionInput(input?: AccountingDimensionInput[]): AccountingDimensionInput[] {
  const normalized = (input ?? [])
    .map((d) => ({ key: String(d.key).trim(), value: String(d.value).trim() }))
    .filter((d) => d.key.length > 0 && d.value.length > 0)

  const seen = new Set<string>()
  for (const d of normalized) {
    if (seen.has(d.key)) {
      throw new Error(`Dubleret konteringsdimension: ${d.key}`)
    }
    seen.add(d.key)
  }

  return normalized
}

export function resolveDimensionValueRows(options: {
  ruleId: number
  dimensions?: AccountingDimensionInput[]
  definitions: AccountingDimensionDefinition[]
  constraints?: AccountingDimensionConstraint[]
}): Array<typeof ruleAccountingDimensionValue.$inferInsert> {
  const input = normalizeDimensionInput(options.dimensions)
  const byKey = new Map(options.definitions.map((d) => [d.key, d]))

  for (const d of input) {
    if (!byKey.has(d.key)) {
      throw new Error(`Ukendt konteringsdimension for ERP: ${d.key}`)
    }
  }

  for (const def of options.definitions) {
    if (def.required && !input.some((d) => d.key === def.key)) {
      throw new Error(`Manglende påkrævet konteringsdimension: ${def.key}`)
    }
  }

  // Validate value formats using data-driven regex per definition.
  for (const d of input) {
    const def = byKey.get(d.key)
    if (!def) continue
    if (!def.valueRegex) continue

    const flags = def.valueRegexFlags ?? ''
    let re: RegExp
    try {
      re = new RegExp(def.valueRegex, flags)
    } catch {
      throw new Error(`Ugyldig regex for konteringsdimension '${def.key}': ${def.valueRegex}`)
    }

    if (!re.test(d.value)) {
      const hint = accountingDimensionFormatHint(def.key)
      throw new Error(
        `Ugyldigt format for konteringsdimension '${def.key}'` + (hint ? ` (${hint})` : ''),
      )
    }
  }

  validateAccountingDimensionConstraints(
    new Map(input.map((d) => [d.key, d.value])),
    options.constraints,
  )

  return input.map((d) => ({
    ruleId: options.ruleId,
    definitionId: byKey.get(d.key)!.id,
    value: d.value,
  }))
}

export function mapDimensionRowsToDto(rows: Array<{ definition: { key: string }; value: string }>): AccountingDimensionInput[] {
  return rows
    .map((r) => ({ key: r.definition.key, value: r.value }))
    .sort((a, b) => a.key.localeCompare(b.key))
}
