import { defineEventHandler, getQuery, setHeader, createError } from 'h3'
import db from '~/lib/db'
import { ruleConditionFieldValues } from '~/lib/db/schema/enums'
import { getActiveErpSupplier, listAccountingDimensionDefinitions } from '~~/server/utils/accountingDimensions'

function escapeCsvCell(value: string): string {
  const needsQuotes = /[";\n\r]/.test(value)
  const escaped = value.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

function toCsvRow(values: string[]): string {
  return values.map(v => escapeCsvCell(v)).join(';')
}

function escapeMultiValueToken(token: string): string {
  // Must round-trip with splitMultiValueCell(): escape separators and backslash.
  return token
    .replace(/\\/g, '\\\\')
    .replace(/&/g, '\\&')
    .replace(/\|/g, '\\|')
    .replace(/,/g, '\\,')
}

function joinMulti(values: string[]): string {
  const cleaned = values
    .map(v => String(v ?? '').trim())
    .filter(Boolean)
    .map(escapeMultiValueToken)
  return cleaned.join(' & ')
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const variant = typeof query.variant === 'string' ? query.variant : 'advanced'
  const isAdvanced = variant === 'advanced'

  if (!isAdvanced) {
    // Export is intended to be uploadable without data loss.
    throw createError({
      statusCode: 400,
      statusMessage: 'Kun avanceret eksport er understøttet (variant=advanced)',
    })
  }

  // Export is always meant to be round-trippable.
  // Standard variant is only supported for rules that can be represented by global matchOperator + match* columns.
  const supplier = await getActiveErpSupplier()
  const dimensionDefinitions = await listAccountingDimensionDefinitions(supplier)

  const headers = [
    'type',
    'status',
    'relatedBankAccounts',
    'ruleTags',
    'matchOperator',
    'matchReferences',
    'matchCounterparties',
    'matchClassification',
    'matchAmountMin',
    'matchAmountMax',
    'accountingText',
    'accountingCprType',
    'accountingCprNumber',
    'accountingNotifyTo',
    'accountingNote',
    ...dimensionDefinitions.map(d => `dim_${d.key}`),
    ...(ruleConditionFieldValues.map(f => `field_${f}`)),
  ]

  const rows = await db.query.rule.findMany({
    where: (fields, { eq }) => eq(fields.erpSupplier, supplier),
    with: {
      bankAccounts: { columns: { bankAccountId: true } },
      tags: { columns: { ruleTagId: true } },
      conditions: true,
      accountingDimensions: {
        with: { definition: { columns: { key: true } } },
        columns: { value: true },
      },
      accountingParameters: true,
    },
    orderBy: (rule, { asc }) => [asc(rule.id)],
  })

  const lines: string[] = []
  lines.push(toCsvRow(headers))

  for (const r of rows) {
    const relatedBankAccounts = joinMulti((r.bankAccounts ?? []).map(a => a.bankAccountId).filter(Boolean) as string[])
    const ruleTags = joinMulti((r.tags ?? []).map(t => t.ruleTagId).filter(Boolean) as string[])

    // Amounts can be numbers or strings depending on pg type parsers.
    const amountMin = r.matchAmountMin == null ? '' : String(r.matchAmountMin)
    const amountMax = r.matchAmountMax == null ? '' : String(r.matchAmountMax)

    const accountingText = r.accountingParameters?.bookingText ?? ''
    const accountingCprType = r.accountingParameters?.cprType ?? 'ingen'
    const accountingCprNumber = r.accountingParameters?.cprNumber ?? ''
    const accountingNotifyTo = r.accountingParameters?.notifyTo ?? ''
    const accountingNote = r.accountingParameters?.note ?? ''

    const dimByKey = new Map<string, string>()
    for (const d of r.accountingDimensions ?? []) {
      const key = d.definition?.key
      if (!key) continue
      dimByKey.set(key, String(d.value ?? '').trim())
    }

    const matchOperator = 'eq'
    const matchReferences = ''
    const matchCounterparties = ''
    const matchClassification = ''

    const fieldCellByKey = new Map<string, string[]>()
    for (const condition of r.conditions ?? []) {
      const fieldKey = String(condition.field)
      const op = String(condition.operator ?? 'eq')
      const value = String(condition.value ?? '').trim()
      if (!value.length) continue

      const token = op === 'eq'
        ? value
        : `${op}:${value}`

      const bucket = fieldCellByKey.get(fieldKey) ?? []
      bucket.push(token)
      fieldCellByKey.set(fieldKey, bucket)
    }

    const values: string[] = []
    values.push(String(r.type ?? ''))
    values.push(String(r.status ?? ''))
    values.push(relatedBankAccounts)
    values.push(ruleTags)
    values.push(matchOperator)
    values.push(matchReferences)
    values.push(matchCounterparties)
    values.push(matchClassification)
    values.push(amountMin)
    values.push(amountMax)
    values.push(String(accountingText ?? ''))
    values.push(String(accountingCprType ?? 'ingen'))
    values.push(String(accountingCprNumber ?? ''))
    values.push(String(accountingNotifyTo ?? ''))
    values.push(String(accountingNote ?? ''))

    for (const def of dimensionDefinitions) {
      values.push(dimByKey.get(def.key) ?? '')
    }

    for (const fieldKey of ruleConditionFieldValues) {
      values.push(joinMulti(fieldCellByKey.get(fieldKey) ?? []))
    }

    lines.push(toCsvRow(values))
  }

  const csv = lines.join('\n')

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(
    event,
    'Content-Disposition',
    `attachment; filename="rules_export_${supplier}_advanced.csv"`,
  )
  setHeader(event, 'Cache-Control', 'no-store')

  return csv
})
