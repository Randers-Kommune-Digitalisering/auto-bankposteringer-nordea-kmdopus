import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

import {
  decryptEncryptedDataToXml,
  encryptXmlToEncryptedData,
} from '../../engine/banking-ingestion/infrastructure/bxd/xmlEnc'

const fixturePath = (name: string) =>
  new URL(`../fixtures/nordea-secure-envelope/${name}`, import.meta.url)

describe('BXD XMLENC (roundtrip)', () => {
  it('encrypts and decrypts EncryptedData with rsa-1_5 + aes256-cbc', async () => {
    const privateKeyPem = await readFile(fixturePath('test-private-key.pem'), 'utf8')
    const certificatePem = await readFile(fixturePath('test-certificate.pem'), 'utf8')

    const plaintext = '<Test><A>hello</A></Test>'

    const encrypted = await encryptXmlToEncryptedData(plaintext, {
      recipientCertificatePem: certificatePem,
      encryptionAlgorithm: 'http://www.w3.org/2001/04/xmlenc#aes256-cbc',
      keyEncryptionAlgorithm: 'http://www.w3.org/2001/04/xmlenc#rsa-1_5',
      warnInsecureAlgorithm: false,
    })

    expect(encrypted).toContain('EncryptedData')

    const decrypted = await decryptEncryptedDataToXml(encrypted, {
      privateKeyPem,
      warnInsecureAlgorithm: false,
    })

    expect(decrypted).toBe(plaintext)
  })
})
