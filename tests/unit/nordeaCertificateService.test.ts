import { describe, expect, it } from 'vitest'
import crypto from 'node:crypto'

import {
  buildNordeaCertApplicationRequestXml,
  certDerBase64ToPem,
  computeNordeaCertApplicationHmacBase64,
} from '../../engine/banking-ingestion/infrastructure/nordea/certificateService'

describe('Nordea CertificateService helpers', () => {
  it('computes HMAC base64 over CSR DER bytes with activation code', () => {
    const csrDer = Buffer.from('test-csr-der')
    const activationCode = '1234567890'

    const expected = crypto
      .createHmac('sha1', Buffer.from(activationCode, 'ascii'))
      .update(csrDer)
      .digest('base64')

    const actual = computeNordeaCertApplicationHmacBase64({ csrDer, activationCode })
    expect(actual).toBe(expected)
  })

  it('builds CertApplicationRequest xml with required elements', () => {
    const xml = buildNordeaCertApplicationRequestXml({
      customerId: '5780860238',
      softwareId: 'ABP',
      environment: 'PRODUCTION',
      command: 'GetCertificate',
      service: 'service',
      csrDerBase64: 'Q1NS',
      hmacBase64: 'SE1BQw==',
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
    })

    expect(xml).toContain('<ns2:CertApplicationRequest')
    expect(xml).toContain('<ns2:CustomerId>5780860238</ns2:CustomerId>')
    expect(xml).toContain('<ns2:Environment>PRODUCTION</ns2:Environment>')
    expect(xml).toContain('<ns2:Command>GetCertificate</ns2:Command>')
    expect(xml).toContain('<ns2:Content>Q1NS</ns2:Content>')
    expect(xml).toContain('<ns2:HMAC>SE1BQw==</ns2:HMAC>')
  })

  it('converts certificate DER base64 to PEM format', () => {
    const derBase64 = Buffer.from('dummy-der-cert').toString('base64')
    const pem = certDerBase64ToPem(derBase64)

    expect(pem).toContain('-----BEGIN CERTIFICATE-----')
    expect(pem).toContain('-----END CERTIFICATE-----')
  })
})
