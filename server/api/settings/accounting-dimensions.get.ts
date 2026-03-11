import { defineEventHandler } from 'h3'
import { getActiveErpSupplier, listAccountingDimensionDefinitions } from '~~/server/utils/accountingDimensions'

export default defineEventHandler(async () => {
  const supplier = await getActiveErpSupplier()
  const definitions = await listAccountingDimensionDefinitions(supplier)

  return {
    erpSupplier: supplier,
    dimensions: definitions,
  }
})
