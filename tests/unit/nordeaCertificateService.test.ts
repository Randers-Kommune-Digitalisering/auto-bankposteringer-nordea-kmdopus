import { describe, expect, it, vi } from 'vitest'
import crypto from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { verifyEnvelopedXmlDsig, sha256FingerprintHexFromCertPem } from '../../engine/banking-ingestion/infrastructure/bxd/xmlDsig'

import {
  buildNordeaCertApplicationRequestXml,
  certDerBase64ToPem,
  computeNordeaCertApplicationHmacBase64,
  nordeaCertificateServiceGetCertificate,
  NordeaCertificateServiceError,
} from '../../engine/banking-ingestion/infrastructure/nordea/certificateService'
import {
  renewalSigningMaterialFromEnv,
  validateRenewalSigningMaterial,
} from '../../scripts/banking/nordea/certificate-service-create-certificate'

const secureEnvelopeFixture = (name: string) =>
  new URL(`../fixtures/nordea-secure-envelope/${name}`, import.meta.url)

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
      authentication: { type: 'hmac', hmacBase64: 'SE1BQw==' },
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
    })

    expect(xml).toContain('<ns2:CertApplicationRequest')
    expect(xml).toContain('<ns2:CustomerId>5780860238</ns2:CustomerId>')
    expect(xml).toContain('<ns2:Environment>PRODUCTION</ns2:Environment>')
    expect(xml).toContain('<ns2:Command>GetCertificate</ns2:Command>')
    expect(xml).toContain('<ns2:Content>Q1NS</ns2:Content>')
    expect(xml).toContain('<ns2:HMAC>SE1BQw==</ns2:HMAC>')
  })

  it('signs renewal CertApplicationRequest with XMLDSig instead of adding HMAC', async () => {
    const privateKeyPem = await readFile(new URL('../fixtures/nordea-secure-envelope/test-private-key.pem', import.meta.url), 'utf8')
    const certificatePem = await readFile(new URL('../fixtures/nordea-secure-envelope/test-certificate.pem', import.meta.url), 'utf8')
    const unsignedXml = buildNordeaCertApplicationRequestXml({
      customerId: '5780860238',
      softwareId: 'ABP',
      environment: 'PRODUCTION',
      command: 'GetCertificate',
      service: 'service',
      csrDerBase64: 'Q1NS',
      authentication: { type: 'signature', privateKeyPem, certificatePem },
      timestamp: new Date('2026-01-01T00:00:00.000Z'),
    })

    expect(unsignedXml).toContain('<ns2:Content>Q1NS</ns2:Content>')
    expect(unsignedXml).not.toContain('<ns2:HMAC>')
    expect(unsignedXml).toContain('<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315#WithComments"/>')
    expect(unsignedXml).toContain('<SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>')
    expect(unsignedXml).toContain('<Reference URI="">')
    expect(unsignedXml).toContain('<Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/></Transforms>')
    expect(unsignedXml).toContain('<DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>')
    expect(unsignedXml).toContain('<X509IssuerSerial>')
    expect(unsignedXml).toContain('<X509IssuerName>')
    expect(unsignedXml).toMatch(/<X509SerialNumber>\d+<\/X509SerialNumber>/)
    expect(unsignedXml).not.toContain(' Id=')

    const verified = verifyEnvelopedXmlDsig({
      xml: unsignedXml,
      verificationCertificatePem: certificatePem,
      trustedCertificateFingerprintSha256Hex: sha256FingerprintHexFromCertPem(certificatePem),
    })
    expect(verified.isSignatureValid).toBe(true)
  })

  it('converts certificate DER base64 to PEM format', () => {
    const derBase64 = Buffer.from('dummy-der-cert').toString('base64')
    const pem = certDerBase64ToPem(derBase64)

    expect(pem).toContain('-----BEGIN CERTIFICATE-----')
    expect(pem).toContain('-----END CERTIFICATE-----')
  })

  it('accepts a matching, currently valid RSA renewal certificate and key', async () => {
    const privateKeyPem = await readFile(secureEnvelopeFixture('test-private-key.pem'), 'utf8')
    const certificatePem = await readFile(secureEnvelopeFixture('test-certificate.pem'), 'utf8')

    expect(() => validateRenewalSigningMaterial({
      privateKeyPem,
      certificatePem,
      now: new Date('2026-10-20T00:00:00.000Z'),
    })).not.toThrow()
    expect(() => validateRenewalSigningMaterial({
      privateKeyPem,
      certificatePem,
      now: new Date('2040-01-01T00:00:00.000Z'),
    })).toThrow(/not currently valid/)
  })

  it('loads and validates a renewal signer from Base64 PEM environment values', async () => {
    const privateKeyPem = await readFile(secureEnvelopeFixture('test-private-key.pem'), 'utf8')
    const certificatePem = await readFile(secureEnvelopeFixture('test-certificate.pem'), 'utf8')
    const material = renewalSigningMaterialFromEnv({
      NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM_B64: Buffer.from(privateKeyPem).toString('base64'),
      NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM_B64: Buffer.from(certificatePem).toString('base64'),
    })

    expect(material).toEqual({ privateKeyPem, certificatePem })
  })

  it('preserves the raw SOAP fault response for diagnostics', async () => {
    const responseXml = '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><soap:Fault><faultcode>env:Client</faultcode><faultstring>Internal Error</faultstring></soap:Fault></soap:Body></soap:Envelope>'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(responseXml, { status: 200 })))

    try {
      await nordeaCertificateServiceGetCertificate({}, {
        senderId: 'test-sender',
        requestId: 'test-request',
        certApplicationRequestXml: '<CertApplicationRequest/>',
      })
      throw new Error('Expected CertificateService SOAP fault')
    } catch (error) {
      expect(error).toBeInstanceOf(NordeaCertificateServiceError)
      expect((error as NordeaCertificateServiceError).responseXml).toBe(responseXml)
      expect((error as Error).message).toContain('env:Client')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
