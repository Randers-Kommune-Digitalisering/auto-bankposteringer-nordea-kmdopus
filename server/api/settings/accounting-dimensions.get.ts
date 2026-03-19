import { defineEventHandler } from 'h3'
import { getActiveErpSupplier, listAccountingDimensionConstraints, listAccountingDimensionDefinitions } from '~~/server/utils/accountingDimensions'

export default defineEventHandler(async () => {
  const supplier = await getActiveErpSupplier()
  const definitions = await listAccountingDimensionDefinitions(supplier)
  const constraints = await listAccountingDimensionConstraints(supplier)

  return {
    erpSupplier: supplier,
    dimensions: definitions,
    constraints,
  }
})
