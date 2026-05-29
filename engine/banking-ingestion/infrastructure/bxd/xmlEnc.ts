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
import { DOMParser } from '@xmldom/xmldom'
import forge from 'node-forge'

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

function collectElementsByLocalName(root: Node, localName: string): Element[] {
  const out: Element[] = []
  const visit = (node: Node) => {
    const anyNode = node as any
    const name = String(anyNode?.localName ?? anyNode?.nodeName ?? '')
    const normalized = name.includes(':') ? name.split(':').pop() : name
    if (normalized === localName && anyNode?.nodeType === 1) {
      out.push(anyNode as Element)
    }
    const children = anyNode?.childNodes ?? []
    for (let i = 0; i < children.length; i += 1) {
      visit(children[i])
    }
  }
  visit(root)
  return out
}

function firstElementByLocalName(root: Node, localName: string): Element | null {
  return collectElementsByLocalName(root, localName)[0] ?? null
}

function firstTextByLocalName(root: Node, localName: string): string | null {
  const node = firstElementByLocalName(root, localName)
  const text = node?.textContent?.trim() ?? ''
  return text.length > 0 ? text : null
}

function directChildByLocalName(root: Node, localName: string): Element | null {
  const children = (root as any)?.childNodes ?? []
  for (let i = 0; i < children.length; i += 1) {
    const child = children[i] as any
    if (child?.nodeType !== 1) continue
    const name = String(child?.localName ?? child?.nodeName ?? '')
    const normalized = name.includes(':') ? name.split(':').pop() : name
    if (normalized === localName) return child as Element
  }
  return null
}

function directChildTextByLocalName(root: Node, localName: string): string | null {
  const child = directChildByLocalName(root, localName)
  const text = child?.textContent?.trim() ?? ''
  return text.length > 0 ? text : null
}

function decryptWithAlgorithm(algorithm: string, symmetricKey: Buffer, ivLength: number, content: Buffer): string {
  const decipher = crypto.createDecipheriv(algorithm, symmetricKey, content.slice(0, ivLength))
  decipher.setAutoPadding(false)

  let body = content
  if (algorithm.endsWith('gcm')) {
    ;(decipher as crypto.DecipherGCM).setAuthTag(content.slice(-16))
    body = content.slice(0, -16)
  }

  let decrypted = decipher.update(body.slice(ivLength), undefined, 'binary') + decipher.final('binary')

  if (!algorithm.endsWith('gcm')) {
    const padding = decrypted.charCodeAt(decrypted.length - 1)
    if (padding < 1 || padding > ivLength) {
      throw new Error('XMLENC fallback: padding length invalid')
    }
    decrypted = decrypted.slice(0, -padding)
  }

  return Buffer.from(decrypted, 'binary').toString('utf8')
}

function decryptEncryptedDataToXmlFallbackRsa15(encryptedDataXml: string, privateKeyPem: string): string {
  const doc = new DOMParser().parseFromString(encryptedDataXml, 'application/xml')

  const encryptedData = firstElementByLocalName(doc, 'EncryptedData')
  if (!encryptedData) throw new Error('XMLENC fallback: missing EncryptedData')

  const encryptionMethod = firstElementByLocalName(encryptedData, 'EncryptionMethod')
  const dataEncryptionAlgorithm = encryptionMethod?.getAttribute('Algorithm') ?? ''
  if (!dataEncryptionAlgorithm) throw new Error('XMLENC fallback: missing data EncryptionMethod')

  const keyInfo = firstElementByLocalName(encryptedData, 'KeyInfo')
  if (!keyInfo) throw new Error('XMLENC fallback: missing KeyInfo')

  const encryptedKey = firstElementByLocalName(keyInfo, 'EncryptedKey')
  if (!encryptedKey) throw new Error('XMLENC fallback: missing EncryptedKey')

  const keyEncryptionMethod = firstElementByLocalName(encryptedKey, 'EncryptionMethod')
  const keyEncryptionAlgorithm = keyEncryptionMethod?.getAttribute('Algorithm') ?? ''
  if (keyEncryptionAlgorithm !== 'http://www.w3.org/2001/04/xmlenc#rsa-1_5') {
    throw new Error(`XMLENC fallback: unsupported key encryption algorithm ${keyEncryptionAlgorithm}`)
  }

  const encryptedKeyCipherData = directChildByLocalName(encryptedKey, 'CipherData')
  const encryptedKeyB64 = encryptedKeyCipherData
    ? directChildTextByLocalName(encryptedKeyCipherData, 'CipherValue')
    : null
  if (!encryptedKeyB64) throw new Error('XMLENC fallback: missing encrypted symmetric key')

  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem)
  const symmetricKeyBinary = privateKey.decrypt(forge.util.decode64(encryptedKeyB64), 'RSAES-PKCS1-V1_5')
  const symmetricKey = Buffer.from(symmetricKeyBinary, 'binary')

  const encryptedDataCipherData = directChildByLocalName(encryptedData, 'CipherData')
  const encryptedContentB64 = encryptedDataCipherData
    ? directChildTextByLocalName(encryptedDataCipherData, 'CipherValue')
    : null
  if (!encryptedContentB64) throw new Error('XMLENC fallback: missing encrypted content')
  const encryptedContent = Buffer.from(encryptedContentB64, 'base64')

  switch (dataEncryptionAlgorithm) {
    case 'http://www.w3.org/2001/04/xmlenc#aes128-cbc':
      return decryptWithAlgorithm('aes-128-cbc', symmetricKey, 16, encryptedContent)
    case 'http://www.w3.org/2001/04/xmlenc#aes256-cbc':
      return decryptWithAlgorithm('aes-256-cbc', symmetricKey, 16, encryptedContent)
    case 'http://www.w3.org/2001/04/xmlenc#tripledes-cbc':
      return decryptWithAlgorithm('des-ede3-cbc', symmetricKey, 8, encryptedContent)
    case 'http://www.w3.org/2009/xmlenc11#aes128-gcm':
      return decryptWithAlgorithm('aes-128-gcm', symmetricKey, 12, encryptedContent)
    case 'http://www.w3.org/2009/xmlenc11#aes256-gcm':
      return decryptWithAlgorithm('aes-256-gcm', symmetricKey, 12, encryptedContent)
    default:
      throw new Error(`XMLENC fallback: unsupported data encryption algorithm ${dataEncryptionAlgorithm}`)
  }
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
        if (err) {
          const msg = String((err as any)?.message ?? err)
          if (msg.includes('RSA_PKCS1_PADDING is no longer supported for private decryption')) {
            try {
              const fallback = decryptEncryptedDataToXmlFallbackRsa15(encryptedDataXml, options.privateKeyPem)
              return resolve(fallback)
            } catch (fallbackErr) {
              return reject(fallbackErr)
            }
          }
          return reject(err)
        }
        resolve(String(result ?? ''))
      },
    )
  })
}
