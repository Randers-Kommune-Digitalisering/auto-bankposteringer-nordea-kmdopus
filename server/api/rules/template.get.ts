import { defineEventHandler, getQuery, setHeader } from 'h3'
import { erpSupplierValues } from '~/lib/db/schema/enums'
import type { ErpSupplier } from '~/lib/db/schema/enums'
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

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const requestedSupplier = typeof query.supplier === 'string' ? query.supplier : undefined
  const variant = typeof query.variant === 'string' ? query.variant : 'standard'
  const isAdvanced = variant === 'advanced'

  const supplier: ErpSupplier = (requestedSupplier && (erpSupplierValues as readonly string[]).includes(requestedSupplier))
    ? (requestedSupplier as ErpSupplier)
    : await getActiveErpSupplier()

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
    ...(isAdvanced ? ruleConditionFieldValues.map(f => `field_${f}`) : []),
  ]

  const csv = toCsvRow(headers)

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(
    event,
    'Content-Disposition',
    `attachment; filename="rule-import-template_${supplier}${isAdvanced ? '_advanced' : ''}.csv"`,
  )
  setHeader(event, 'Cache-Control', 'no-store')

  return csv
})
