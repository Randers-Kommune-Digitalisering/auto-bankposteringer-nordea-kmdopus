/**
 * XML Encryption (XMLENC) helper.
 *
 * Danske Bank Web Services examples wrap payloads as:
 * - <xenc:EncryptedData ...> ... </xenc:EncryptedData>
 * using:
 * - AES-256-CBC for content
 * - RSA v1.5 for transporting the symmetric key (insecure but required by the examples)
 */

import crypto from 'node:crypto'

export type XmlEncEncryptOptions = {
  /** PEM encoded X.509 certificate of the recipient (used for key transport). */
  recipientCertificatePem: string

  /**
   * Algorithm URIs.
   * Defaults match Danske examples.
   */
  encryptionAlgorithm?: string
  keyEncryptionAlgorithm?: string

  /** If true, suppress warnings about insecure algorithms (RSA1_5). */
  warnInsecureAlgorithm?: boolean
}

export type XmlEncDecryptOptions = {
  /** PEM encoded private key of the recipient. */
  privateKeyPem: string

  /** If true, suppress warnings about insecure algorithms (RSA1_5). */
  warnInsecureAlgorithm?: boolean
}

type XmlEncryptionModule = {
  encrypt: (content: string, options: any, cb: (err: any, result?: string) => void) => void
  decrypt: (xml: string, options: any, cb: (err: any, result?: string) => void) => void
}

function publicKeyPemFromCertificatePem(certificatePem: string): string {
  // xml-encryption requires a raw RSA public key PEM in addition to the cert.
  // Node can derive it from the certificate.
  const keyObj = crypto.createPublicKey(certificatePem)
  return keyObj.export({ format: 'pem', type: 'pkcs1' }) as unknown as string
}

async function loadXmlEncryption(): Promise<XmlEncryptionModule> {
  // xml-encryption is CommonJS. In ESM, it is available under default export.
  const mod: any = await import('xml-encryption')
  return (mod?.default ?? mod) as XmlEncryptionModule
}

export async function encryptXmlToEncryptedData(
  xml: string,
  options: XmlEncEncryptOptions,
): Promise<string> {
  const xmlenc = await loadXmlEncryption()

  const encryptionAlgorithm =
    options.encryptionAlgorithm ?? 'http://www.w3.org/2001/04/xmlenc#aes256-cbc'
  const keyEncryptionAlgorithm =
    options.keyEncryptionAlgorithm ?? 'http://www.w3.org/2001/04/xmlenc#rsa-1_5'

  return new Promise((resolve, reject) => {
    xmlenc.encrypt(
      xml,
      {
        rsa_pub: publicKeyPemFromCertificatePem(options.recipientCertificatePem),
        pem: options.recipientCertificatePem,
        encryptionAlgorithm,
        keyEncryptionAlgorithm,
        // Danske examples require RSA1_5. Do not block it.
        disallowEncryptionWithInsecureAlgorithm: false,
        warnInsecureAlgorithm: options.warnInsecureAlgorithm ?? false,
      },
      (err, result) => {
        if (err) return reject(err)
        resolve(String(result ?? ''))
      },
    )
  })
}

export async function decryptEncryptedDataToXml(
  encryptedDataXml: string,
  options: XmlEncDecryptOptions,
): Promise<string> {
  const xmlenc = await loadXmlEncryption()

  return new Promise((resolve, reject) => {
    xmlenc.decrypt(
      encryptedDataXml,
      {
        key: options.privateKeyPem,
        disallowDecryptionWithInsecureAlgorithm: false,
        warnInsecureAlgorithm: options.warnInsecureAlgorithm ?? false,
      },
      (err, result) => {
        if (err) return reject(err)
        resolve(String(result ?? ''))
      },
    )
  })
}
