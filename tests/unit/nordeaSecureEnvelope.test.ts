import { readFile } from 'node:fs/promises'
import { gunzipSync, gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import {
  buildNordeaUploadFileApplicationRequestXml,
  NORDEA_SECURE_ENVELOPE_NAMESPACE,
  parseNordeaApplicationResponseXml,
} from '../../engine/banking-ingestion/infrastructure/nordea/secureEnvelope'
import {
  sha256FingerprintHexFromCertPem,
  signEnvelopedXmlDsig,
  verifyEnvelopedXmlDsig,
} from '../../engine/banking-ingestion/infrastructure/nordea/xmlDsig'

const fixturePath = (name: string) =>
  new URL(`../fixtures/nordea-secure-envelope/${name}`, import.meta.url)

async function readFixture(name: string): Promise<string> {
  return readFile(fixturePath(name), 'utf8')
}

function extractTagText(xml: string, tagName: string): string | null {
  const m = xml.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`))
  return m?.[1]?.trim() ?? null
}

describe('Nordea Secure Envelope', () => {
  it('builds a signed UploadFile ApplicationRequest with optional gzip compression', async () => {
    const privateKeyPem = await readFixture('test-private-key.pem')
    const certificatePem = await readFixture('test-certificate.pem')
    const fingerprint = sha256FingerprintHexFromCertPem(certificatePem)

    const payload = '<Test>hello</Test>'

    const xml = buildNordeaUploadFileApplicationRequestXml(
      {
        customerId: '1122334455',
        signerId: '5780860238',
        fileType: 'NDCAPXMLO',
        softwareId: 'unit-test',
        content: payload,
        compress: true,
      },
      { privateKeyPem, certificatePem },
    )

    // xml-crypto may add an Id attribute to the root element to create a non-empty Reference URI.
    expect(xml).toContain(`<ApplicationRequest xmlns="${NORDEA_SECURE_ENVELOPE_NAMESPACE}"`)
    expect(xml).toContain('<Command>UploadFile</Command>')
    expect(xml).toContain('<Compression>true</Compression>')
    expect(xml).toContain('<CompressionMethod>GZIP</CompressionMethod>')

    const verify = verifyEnvelopedXmlDsig({
      xml,
      trustedCertificateFingerprintSha256Hex: fingerprint,
    })
    expect(verify.isSignatureValid).toBe(true)

    const contentB64 = extractTagText(xml, 'Content')
    expect(contentB64).toBeTruthy()

    const decoded = Buffer.from((contentB64 ?? '').replace(/\s+/g, ''), 'base64')
    const unzipped = gunzipSync(decoded).toString('utf8')
    expect(unzipped).toBe(payload)
  })

  it('parses a signed ApplicationResponse and returns decoded payload', async () => {
    const privateKeyPem = await readFixture('test-private-key.pem')
    const certificatePem = await readFixture('test-certificate.pem')
    const fingerprint = sha256FingerprintHexFromCertPem(certificatePem)

    const payload = Buffer.from('<Camt053>stub</Camt053>', 'utf8')
    const contentB64 = gzipSync(payload).toString('base64')

    const unsigned =
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<ApplicationResponse xmlns="${NORDEA_SECURE_ENVELOPE_NAMESPACE}">` +
      `<CustomerId>1122334455</CustomerId>` +
      `<Timestamp>${new Date('2026-01-01T00:00:00.000Z').toISOString()}</Timestamp>` +
      `<ResponseCode>0</ResponseCode>` +
      `<ResponseText>OK</ResponseText>` +
      `<Encrypted>false</Encrypted>` +
      `<Compressed>true</Compressed>` +
      `<CompressionMethod>GZIP</CompressionMethod>` +
      `<FileType>NDCAC053O</FileType>` +
      `<Content>${contentB64}</Content>` +
      `</ApplicationResponse>`

    const signed = signEnvelopedXmlDsig({
      xml: unsigned,
      privateKeyPem,
      certificatePem,
    })

    const parsed = parseNordeaApplicationResponseXml(signed, {
      trustedCertificateFingerprintSha256Hex: fingerprint,
    })

    expect(parsed.responseCode).toBe('0')
    expect(parsed.responseText).toBe('OK')
    expect(parsed.compressed).toBe(true)
    expect(parsed.signature?.isValid).toBe(true)
    expect(parsed.content?.toString('utf8')).toBe(payload.toString('utf8'))
  })
})
