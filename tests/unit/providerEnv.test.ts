import { describe, expect, it } from 'vitest'
import { inspectProviderEnv } from '../../engine/banking-ingestion/infrastructure/providerEnv'

describe('inspectProviderEnv', () => {
  it('reports a provider as not configured when none of its values are present', () => {
    const result = inspectProviderEnv('nordea', 'iso20022', {})

    expect(result.status).toBe('not_configured')
    expect(result.env.presentKeys).toEqual([])
    expect(result.env.missingKeys).toContain('NORDEA_CA_WS_SENDER_ID')
  })

  it('reports required keys and alternative secret values without returning their contents', () => {
    const result = inspectProviderEnv('nordea', 'iso20022', {
      NORDEA_CA_WS_SENDER_ID: 'sender',
      NORDEA_CA_WS_USER_AGENT: 'agent',
      NORDEA_CA_CUSTOMER_ID: 'customer',
      NORDEA_CA_SIGNER_ID: 'signer',
      NORDEA_CA_SOFTWARE_ID: 'software',
      NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM_B64: 'private-key',
      NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM_B64: 'certificate',
    })

    expect(result.status).toBe('ready')
    expect(result.env.missingKeys).toEqual([])
    expect(JSON.stringify(result)).not.toContain('private-key')
    expect(JSON.stringify(result)).not.toContain('certificate')
  })

  it('reports missing values when only part of a provider configuration is set', () => {
    const result = inspectProviderEnv('nordea', 'iso20022', {
      NORDEA_CA_WS_SENDER_ID: 'sender',
    })

    expect(result.status).toBe('missing_env')
    expect(result.missingKeys).toContain('NORDEA_CA_CUSTOMER_ID')
  })

  it('marks unsupported provider channels as not implemented', () => {
    expect(inspectProviderEnv('bankconnect', 'rest', {}).status).toBe('not_implemented')
  })
})
