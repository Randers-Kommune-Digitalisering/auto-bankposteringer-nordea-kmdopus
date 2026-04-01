import { defineEventHandler, createError, getQuery, setHeader } from 'h3'
import db from '~/lib/db'
import { ruleConditionFieldValues } from '~/lib/db/schema/enums'
import { listAccountingDimensionDefinitions } from '~~/server/utils/accountingDimensions'

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
  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing rule id' })
  }

  const query = getQuery(event)
  const variant = typeof query.variant === 'string' ? query.variant : 'advanced'
  const isAdvanced = variant === 'advanced'

  if (!isAdvanced) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Kun avanceret eksport er understøttet (variant=advanced)',
    })
  }

  const r = await db.query.rule.findFirst({
    where: (fields, { eq }) => eq(fields.id, Number(id)),
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
  })

  if (!r) {
    throw createError({ statusCode: 404, statusMessage: 'Rule not found' })
  }

  const supplier = r.erpSupplier
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

  const relatedBankAccounts = joinMulti((r.bankAccounts ?? []).map(a => a.bankAccountId).filter(Boolean) as string[])
  const ruleTags = joinMulti((r.tags ?? []).map(t => t.ruleTagId).filter(Boolean) as string[])

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

  const csv = [toCsvRow(headers), toCsvRow(values)].join('\n')

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(
    event,
    'Content-Disposition',
    `attachment; filename="rule_${r.id}_${supplier}_advanced.csv"`,
  )
  setHeader(event, 'Cache-Control', 'no-store')

  return csv
})
