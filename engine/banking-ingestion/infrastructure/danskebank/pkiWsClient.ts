import crypto from 'node:crypto'
import { DOMParser } from '@xmldom/xmldom'
import { z } from 'zod'

import { Agent } from 'undici'

import { decryptEncryptedDataToXml, encryptXmlToEncryptedData } from '../bxd/xmlEnc'
import {
  sha256FingerprintHexFromCertPem,
  verifyEnvelopedXmlDsig,
} from '../bxd/xmlDsig'

const pemFromBase64Der = (base64Der: string): string => {
  const clean = base64Der.replace(/\s+/g, '')
  const lines = clean.match(/.{1,64}/g) ?? []
  return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----\n`
}

function firstText(doc: any, tagName: string): string | null {
  const nodes = doc.getElementsByTagName(tagName)
  const node = nodes?.item(0) ?? null
  const text = node?.textContent?.trim() ?? ''
  return text.length > 0 ? text : null
}

function generatePkiRequestId(): string {
  // PKIWS spec: RequestId should be 10 characters or less.
  // Use 10 hex chars (5 bytes) for compactness.
  return crypto.randomBytes(5).toString('hex')
}

function parsePkiFactoryServiceFaultOrNull(doc: any): {
  returnCode: string
  returnText?: string | null
  additionalReturnText?: string | null
} | null {
  const faultNode = doc.getElementsByTagName('PKIFactoryServiceFault')?.item(0) ?? null
  if (!faultNode) return null

  const rc = firstText(doc, 'ReturnCode')
  const rt = firstText(doc, 'ReturnText')
  const art = firstText(doc, 'AdditionalReturnText')
  if (!rc) {
    return { returnCode: 'UNKNOWN', returnText: rt, additionalReturnText: art }
  }
  return { returnCode: rc, returnText: rt, additionalReturnText: art }
}

async function postSoap(options: {
  endpointUrl: string
  soapAction?: string
  xmlBody: string
  timeoutMs: number
  mtls?: { certPem: string; keyPem: string } | null
}): Promise<string> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), options.timeoutMs)
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'text/xml; charset=utf-8',
    }

    // Some .asmx stacks expect SOAPAction; PKI WSDL provides non-empty values.
    if (options.soapAction) {
      headers.SOAPAction = options.soapAction
    }

    const dispatcher = options.mtls
      ? new Agent({
          connect: {
            cert: options.mtls.certPem,
            key: options.mtls.keyPem,
          },
        })
      : undefined

    const res = await fetch(options.endpointUrl, {
      method: 'POST',
      headers,
      body: options.xmlBody,
      signal: controller.signal,
      dispatcher: dispatcher as any,
    })

    const text = await res.text()
    if (!res.ok) {
      throw new Error(`PKIWS HTTP ${res.status} ${res.statusText}: ${text.slice(0, 500)}`)
    }
    return text
  } finally {
    clearTimeout(id)
  }
}

export const danskePkiWsConfigSchema = z.object({
  endpointUrl: z.string().url().default('https://businessws.danskebank.com/ra/pkiservice.asmx'),

  /** PKIWS RequestHeader fields. */
  senderId: z.string().min(1),
  customerId: z.string().min(1),
  interfaceVersion: z.string().min(1).default('1'),

  /** PKIWS RequestHeader Environment. Use 'customertest' during integration tests. */
  environment: z.enum(['production', 'customertest']).default('production'),

  /** Required by GetBankCertificateRequest */
  bankRootCertificateSerialNo: z.string().min(1).default('1111130003'),

  /** Optional pinning for the bank signing certificate returned by GetBankCertificate. */
  trustedBankSigningCertFingerprintSha256Hex: z.string().length(64).optional(),

  /** Optional mTLS client credentials (if required by the bank). */
  mtlsClientCertificatePem: z.string().min(1).optional(),
  mtlsClientPrivateKeyPem: z.string().min(1).optional(),

  timeoutMs: z.number().int().min(1).max(120_000).default(30_000),
})

export type DanskePkiWsConfig = z.infer<typeof danskePkiWsConfigSchema>

export type DanskeBankCertificates = {
  bankEncryptionCertificatePem: string
  bankSigningCertificatePem: string
  bankRootCertificatePem?: string | null
}

export async function danskePkiGetBankCertificates(
  config: DanskePkiWsConfig,
): Promise<DanskeBankCertificates> {
  const cfg = danskePkiWsConfigSchema.parse(config)
  const requestId = generatePkiRequestId()
  const timestamp = new Date().toISOString()

  const soap =
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" ` +
    `xmlns:pkif="http://danskebank.dk/PKI/PKIFactoryService" ` +
    `xmlns:elem="http://danskebank.dk/PKI/PKIFactoryService/elements">` +
    `<soapenv:Header/>` +
    `<soapenv:Body>` +
    `<pkif:GetBankCertificateIn>` +
    `<pkif:RequestHeader>` +
    `<pkif:SenderId>${cfg.senderId}</pkif:SenderId>` +
    `<pkif:CustomerId>${cfg.customerId}</pkif:CustomerId>` +
    `<pkif:RequestId>${requestId}</pkif:RequestId>` +
    `<pkif:Timestamp>${timestamp}</pkif:Timestamp>` +
    `<pkif:InterfaceVersion>${cfg.interfaceVersion}</pkif:InterfaceVersion>` +
    `<pkif:Environment>${cfg.environment}</pkif:Environment>` +
    `</pkif:RequestHeader>` +
    `<elem:GetBankCertificateRequest>` +
    `<elem:BankRootCertificateSerialNo>${cfg.bankRootCertificateSerialNo}</elem:BankRootCertificateSerialNo>` +
    `<elem:Timestamp>${timestamp}</elem:Timestamp>` +
    `<elem:RequestId>${requestId}</elem:RequestId>` +
    `</elem:GetBankCertificateRequest>` +
    `</pkif:GetBankCertificateIn>` +
    `</soapenv:Body>` +
    `</soapenv:Envelope>`

  const responseXml = await postSoap({
    endpointUrl: cfg.endpointUrl,
    soapAction: 'GetBankCertificate',
    xmlBody: soap,
    timeoutMs: cfg.timeoutMs,
    mtls:
      cfg.mtlsClientCertificatePem && cfg.mtlsClientPrivateKeyPem
        ? { certPem: cfg.mtlsClientCertificatePem, keyPem: cfg.mtlsClientPrivateKeyPem }
        : null,
  })

  const doc = new DOMParser().parseFromString(responseXml, 'application/xml')

  // Faults are explicitly not signed/encrypted; short-circuit before signature verification.
  const fault = parsePkiFactoryServiceFaultOrNull(doc)
  if (fault) {
    const extra = fault.additionalReturnText ? ` ${fault.additionalReturnText}` : ''
    throw new Error(`PKIWS fault ${fault.returnCode}: ${fault.returnText ?? ''}${extra}`.trim())
  }

  const bankEnc = firstText(doc, 'BankEncryptionCert')
  const bankSign = firstText(doc, 'BankSigningCert')
  const bankRoot = firstText(doc, 'BankRootCert')

  if (!bankEnc || !bankSign) {
    throw new Error('PKIWS GetBankCertificate: missing BankEncryptionCert/BankSigningCert in response')
  }

  const bankSigningCertificatePem = pemFromBase64Der(bankSign)
  const bankSigningFingerprint = sha256FingerprintHexFromCertPem(bankSigningCertificatePem)

  if (cfg.trustedBankSigningCertFingerprintSha256Hex) {
    if (bankSigningFingerprint.toLowerCase() !== cfg.trustedBankSigningCertFingerprintSha256Hex.toLowerCase()) {
      throw new Error(
        `PKIWS GetBankCertificate: bank signing cert fingerprint mismatch (got ${bankSigningFingerprint})`,
      )
    }
  }

  // Verify signature on the response payload using the embedded bank signing cert.
  // This isn't full PKI validation, but combined with fingerprint pinning it protects against tampering.
  const verify = verifyEnvelopedXmlDsig({
    xml: responseXml,
    trustedCertificateFingerprintSha256Hex: cfg.trustedBankSigningCertFingerprintSha256Hex ?? bankSigningFingerprint,
  })
  if (!verify.isSignatureValid) {
    throw new Error('PKIWS GetBankCertificate: response signature verification failed')
  }

  return {
    bankEncryptionCertificatePem: pemFromBase64Der(bankEnc),
    bankSigningCertificatePem,
    bankRootCertificatePem: bankRoot ? pemFromBase64Der(bankRoot) : null,
  }
}

export const danskePkiCreateCertificateInputSchema = z.object({
  /** PKCS#10 CSR (base64 text) for encryption certificate */
  encryptionCertPkcs10: z.string().min(1),
  /** PKCS#10 CSR (base64 text) for signing certificate */
  signingCertPkcs10: z.string().min(1),
  pin: z.string().min(1),
  keyGeneratorType: z.string().min(1).default('software'),
})

export type DanskePkiCreateCertificateInput = z.infer<typeof danskePkiCreateCertificateInputSchema>

export async function danskePkiCreateCertificate(options: {
  config: DanskePkiWsConfig
  bankEncryptionCertificatePem: string
  input: DanskePkiCreateCertificateInput
}): Promise<{ encryptionCertificatePem: string; signingCertificatePem: string; caCertificatePem?: string | null }> {
  const cfg = danskePkiWsConfigSchema.parse(options.config)
  const input = danskePkiCreateCertificateInputSchema.parse(options.input)
  const requestId = generatePkiRequestId()
  const timestamp = new Date().toISOString()

  // CreateCertificateRequest XML (then encrypted as EncryptedData in SOAP).
  const plaintext =
    `<tns:CreateCertificateRequest xmlns:tns="http://danskebank.dk/PKI/PKIFactoryService/elements">` +
    `<tns:CustomerId>${cfg.customerId}</tns:CustomerId>` +
    `<tns:KeyGeneratorType>${input.keyGeneratorType}</tns:KeyGeneratorType>` +
    `<tns:EncryptionCertPKCS10>${input.encryptionCertPkcs10}</tns:EncryptionCertPKCS10>` +
    `<tns:SigningCertPKCS10>${input.signingCertPkcs10}</tns:SigningCertPKCS10>` +
    `<tns:Timestamp>${timestamp}</tns:Timestamp>` +
    `<tns:RequestId>${requestId}</tns:RequestId>` +
    `<tns:Environment>${cfg.environment}</tns:Environment>` +
    `<tns:PIN>${input.pin}</tns:PIN>` +
    `</tns:CreateCertificateRequest>`

  const encryptedDataXml = await encryptXmlToEncryptedData(plaintext, {
    recipientCertificatePem: options.bankEncryptionCertificatePem,
    encryptionAlgorithm: 'http://www.w3.org/2001/04/xmlenc#aes256-cbc',
    keyEncryptionAlgorithm: 'http://www.w3.org/2001/04/xmlenc#rsa-1_5',
    warnInsecureAlgorithm: false,
  })

  const soap =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" ` +
    `xmlns:pkif="http://danskebank.dk/PKI/PKIFactoryService">` +
    `<soapenv:Header/>` +
    `<soapenv:Body>` +
    `<pkif:CreateCertificateIn>` +
    `<pkif:RequestHeader>` +
    `<pkif:SenderId>${cfg.senderId}</pkif:SenderId>` +
    `<pkif:CustomerId>${cfg.customerId}</pkif:CustomerId>` +
    `<pkif:RequestId>${requestId}</pkif:RequestId>` +
    `<pkif:Timestamp>${timestamp}</pkif:Timestamp>` +
    `<pkif:InterfaceVersion>${cfg.interfaceVersion}</pkif:InterfaceVersion>` +
    `<pkif:Environment>${cfg.environment}</pkif:Environment>` +
    `</pkif:RequestHeader>` +
    encryptedDataXml +
    `</pkif:CreateCertificateIn>` +
    `</soapenv:Body>` +
    `</soapenv:Envelope>`

  const responseXml = await postSoap({
    endpointUrl: cfg.endpointUrl,
    soapAction: 'CreateCertificate',
    xmlBody: soap,
    timeoutMs: cfg.timeoutMs,
    mtls:
      cfg.mtlsClientCertificatePem && cfg.mtlsClientPrivateKeyPem
        ? { certPem: cfg.mtlsClientCertificatePem, keyPem: cfg.mtlsClientPrivateKeyPem }
        : null,
  })

  const doc = new DOMParser().parseFromString(responseXml, 'application/xml')
  const fault = parsePkiFactoryServiceFaultOrNull(doc)
  if (fault) {
    const extra = fault.additionalReturnText ? ` ${fault.additionalReturnText}` : ''
    throw new Error(`PKIWS fault ${fault.returnCode}: ${fault.returnText ?? ''}${extra}`.trim())
  }

  const enc = firstText(doc, 'EncryptionCert')
  const sign = firstText(doc, 'SigningCert')
  const ca = firstText(doc, 'CACert')
  const rc = firstText(doc, 'ReturnCode')
  const rt = firstText(doc, 'ReturnText')

  if (rc && rc !== '00' && rc !== '000') {
    throw new Error(`PKIWS CreateCertificate failed: ${rc} ${rt ?? ''}`)
  }

  if (!enc || !sign) {
    throw new Error('PKIWS CreateCertificate: missing EncryptionCert/SigningCert in response')
  }

  return {
    encryptionCertificatePem: pemFromBase64Der(enc),
    signingCertificatePem: pemFromBase64Der(sign),
    caCertificatePem: ca ? pemFromBase64Der(ca) : null,
  }
}
