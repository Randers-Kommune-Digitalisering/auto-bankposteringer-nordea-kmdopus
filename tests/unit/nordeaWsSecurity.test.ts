import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'

import { buildSignedSoapEnvelope, verifySoapSignatureOrThrow } from '../../engine/banking-ingestion/infrastructure/nordea/nordeaWsSecurity'

const fixturePath = (name: string) =>
  new URL(`../fixtures/nordea-secure-envelope/${name}`, import.meta.url)

describe('Nordea WS-Security (SOAP Body signature)', () => {
  it('builds a signed SOAP envelope that verifies', async () => {
    const privateKeyPem = await readFile(fixturePath('test-private-key.pem'), 'utf8')
    const certificatePem = await readFile(fixturePath('test-certificate.pem'), 'utf8')

    const soap = buildSignedSoapEnvelope({
      bodyInnerXml:
        `<cor:getUserInfoin>` +
        `<mod:RequestHeader>` +
        `<mod:SenderId>TEST</mod:SenderId>` +
        `<mod:RequestId>TEST</mod:RequestId>` +
        `<mod:Timestamp>${new Date().toISOString()}</mod:Timestamp>` +
        `<mod:Language>EN</mod:Language>` +
        `<mod:UserAgent>unit-test</mod:UserAgent>` +
        `<mod:ReceiverId>Nordea</mod:ReceiverId>` +
        `</mod:RequestHeader>` +
        `<mod:ApplicationRequest>dGVzdA==</mod:ApplicationRequest>` +
        `</cor:getUserInfoin>`,
      signingPrivateKeyPem: privateKeyPem,
      signingCertificatePem: certificatePem,
    })

    expect(soap).toContain('wsse:Security')
    expect(soap).toContain('wsu:Timestamp')
    expect(soap).toContain('BinarySecurityToken')
    expect(soap).toContain('Signature')

    expect(() => verifySoapSignatureOrThrow({ soapXml: soap })).not.toThrow()
  })
})
