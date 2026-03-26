import { erpIntegrationMetadata } from '~/lib/env/env'
import type { ErpAdapter } from './ports/erpAdapter'
import { kmdErpAdapter } from './infrastructure/adapters/kmd/kmdErpAdapter'

export function getActiveErpSupplierKey(): string {
  return (erpIntegrationMetadata.erpSupplier ?? '').trim() || 'kmd'
}

export function getErpAdapter(supplierKey?: string): ErpAdapter {
  const key = (supplierKey ?? getActiveErpSupplierKey()).trim()

  if (key === 'kmd') {
    return kmdErpAdapter()
  }

  throw new Error(`Ukendt ERP leverandør: ${key}`)
}
