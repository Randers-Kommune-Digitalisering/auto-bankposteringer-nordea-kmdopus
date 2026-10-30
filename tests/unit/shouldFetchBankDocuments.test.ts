import { describe, expect, it } from 'vitest'
import { shouldFetchBankDocuments } from '../../engine/banking-ingestion/handlers/runTransactionBatch'

describe('shouldFetchBankDocuments', () => {
  it('fetches when there are no persisted transactions yet', () => {
    expect(shouldFetchBankDocuments(0, { eventType: 'completed', status: 'succeeded' })).toBe(true)
  })

  it('retries bank retrieval after a partial provider failure', () => {
    expect(shouldFetchBankDocuments(5, { eventType: 'completed_with_errors', status: 'failed' })).toBe(true)
  })

  it('reuses persisted transactions after successful bank retrieval', () => {
    expect(shouldFetchBankDocuments(5, { eventType: 'completed', status: 'succeeded' })).toBe(false)
  })

  it('fetches again when persisted transactions have no completed ingestion event', () => {
    expect(shouldFetchBankDocuments(5)).toBe(true)
  })
})
