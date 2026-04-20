import { describe, expect, it } from 'vitest'

import { loadDanskeBankEdiEnvConfig } from '../../engine/banking-ingestion/infrastructure/danskebank/danskeBankEdiEnvConfig'

describe('loadDanskeBankEdiEnvConfig', () => {
  it('derives EDI sender/customer IDs from PKI IDs when omitted', () => {
    const cfg = loadDanskeBankEdiEnvConfig({
      DANSKE_BANK_PKI_SENDER_ID: '5Q4192',
      DANSKE_BANK_PKI_CUSTOMER_ID: '351340',

      DANSKE_BANK_EDI_USER_AGENT: 'EDI WS RANDERS KOMMUNE',
      DANSKE_BANK_SOFTWARE_ID: 'SOFTWARE',
    } as any)

    expect(cfg.DANSKE_BANK_EDI_SENDER_ID).toBe('5Q4192')
    expect(cfg.DANSKE_BANK_CUSTOMER_ID).toBe('351340')
    expect(cfg.DANSKE_BANK_SIGNER_ID).toBe('351340')
  })

  it('keeps explicit EDI sender/customer IDs when provided', () => {
    const cfg = loadDanskeBankEdiEnvConfig({
      DANSKE_BANK_PKI_SENDER_ID: 'PKI',
      DANSKE_BANK_PKI_CUSTOMER_ID: 'PKI-CUST',

      DANSKE_BANK_EDI_SENDER_ID: 'EDI',
      DANSKE_BANK_CUSTOMER_ID: 'EDI-CUST',

      DANSKE_BANK_EDI_USER_AGENT: 'UA',
      DANSKE_BANK_SIGNER_ID: 'SIGNER',
      DANSKE_BANK_SOFTWARE_ID: 'SOFTWARE',
    } as any)

    expect(cfg.DANSKE_BANK_EDI_SENDER_ID).toBe('EDI')
    expect(cfg.DANSKE_BANK_CUSTOMER_ID).toBe('EDI-CUST')
    expect(cfg.DANSKE_BANK_SIGNER_ID).toBe('SIGNER')
  })
})
