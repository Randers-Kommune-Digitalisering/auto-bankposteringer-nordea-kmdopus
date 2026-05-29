import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import {
  buildNordeaCertApplicationRequestXml,
  computeNordeaCertApplicationHmacBase64,
  nordeaCertificateServiceGetCertificate,
  parseNordeaCertificateServiceResponseXml,
} from '../../../engine/banking-ingestion/infrastructure/nordea/certificateService'
import { sha256FingerprintHexFromCertPem } from '../../../engine/banking-ingestion/infrastructure/bxd/xmlDsig'

type Args = Record<string, string | boolean>

function parseArgs(argv: string[]): Args {
  const out: Args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]!
    if (!a.startsWith('--')) continue

    const eq = a.indexOf('=')
    if (eq !== -1) {
      out[a.slice(2, eq)] = a.slice(eq + 1)
      continue
    }

    const key = a.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) {
      out[key] = true
    } else {
      out[key] = next
      i += 1
    }
  }
  return out
}

function requireString(args: Args, key: string): string {
  const v = args[key]
  if (typeof v === 'string' && v.trim().length > 0) return v.trim()

  const envKeys =
    key === 'activation-code'
      ? ['NORDEA_CERT_ACTIVATION_CODE']
      : key === 'customer-id'
        ? ['NORDEA_CA_WS_SENDER_ID', 'NORDEA_CA_CUSTOMER_ID']
        : key === 'sender-id'
          ? ['NORDEA_CA_WS_SENDER_ID']
          : key === 'software-id'
            ? ['NORDEA_CA_SOFTWARE_ID']
            : key === 'subject-cn'
              ? ['NORDEA_CERT_SUBJECT_CN']
              : key === 'subject-serial-number'
                ? ['NORDEA_CA_SIGNER_ID', 'NORDEA_CERT_SUBJECT_SERIAL_NUMBER']
                : key === 'subject-country-code'
                  ? ['NORDEA_CERT_SUBJECT_COUNTRY_CODE']
                  : undefined

  if (envKeys) {
    for (const envKey of envKeys) {
      const ev = process.env[envKey]
      if (typeof ev === 'string' && ev.trim().length > 0) return ev.trim()
    }
    throw new Error(`Missing required argument: --${key} (or set ${envKeys.join(' / ')})`)
  }

  throw new Error(`Missing required argument: --${key}`)
}

function optionalString(args: Args, key: string): string | undefined {
  const v = args[key]
  if (typeof v !== 'string') return undefined
  const trimmed = v.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function base64NoWrap(buf: Buffer): string {
  return buf.toString('base64')
}

function runOpenSsl(cmd: string, args: string[], cwd: string) {
  const res = spawnSync(cmd, args, { cwd, encoding: 'utf8' })
  if (res.status !== 0) {
    const stderr = (res.stderr || '').trim()
    const stdout = (res.stdout || '').trim()
    throw new Error(`OpenSSL failed: ${cmd} ${args.join(' ')}\n${stderr || stdout}`)
  }
}

function usage() {
  console.log(`
Nordea CertificateService: create/download certificate (WSDL aligned)

Usage:
  pnpm tsx scripts/banking/nordea/certificate-service-create-certificate.ts \
    [--activation-code <10-digit SMS code> | --activation-code-file <path>] \
    --customer-id <CustomerId from agreement> \
    --sender-id <WS SenderId> \
    --software-id <software id> \
    --subject-cn "Company name" \
    --subject-serial-number <SignerID> \
    --subject-country-code <DK|FI|NO|SE> \
    [--endpoint-url https://filetransfer.nordea.com/services/CertificateService/sha2] \
    [--soap-action ""] \
    [--request-id <id>] \
    [--out-dir <directory>] \
    [--key-bits 2048] \
    [--print-secrets] \
    [--dry-run]

Recover mode (no live call):
  pnpm tsx scripts/banking/nordea/certificate-service-create-certificate.ts \
    --recover-response-file <path-to-soap-or-certapplicationresponse.xml> \
    --recover-private-key-path <path-to-private-key.pem> \
    [--out-dir <directory>] \
    [--print-secrets]

Notes:
  - Uses getCertificatein + RequestHeader + base64 ApplicationRequest as required by CertificateService WSDL/XSD.
  - The CSR subject is: /C=<country>/serialNumber=<signerId>/CN=<company>.
  - HMAC is HMAC-SHA1 over CSR DER bytes using activation code as ASCII key.
  - Secure default: secrets are written to files in out-dir, not printed to terminal.
`)
}

function validateCountryCode(value: string): string {
  const upper = value.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(upper)) {
    throw new Error(`Invalid --subject-country-code. Expected two letters (got ${value})`)
  }
  return upper
}

function readActivationCode(args: Args): string {
  const fromArg = optionalString(args, 'activation-code')
  const fromFile = optionalString(args, 'activation-code-file')
  const fromEnv = process.env.NORDEA_CERT_ACTIVATION_CODE?.trim()

  if (fromArg && fromFile) {
    throw new Error('Use either --activation-code or --activation-code-file, not both.')
  }

  if (fromArg) return fromArg

  if (fromFile) {
    const fromDisk = fs.readFileSync(fromFile, 'utf8').trim()
    if (!fromDisk) throw new Error(`Activation code file is empty: ${fromFile}`)
    return fromDisk
  }

  if (fromEnv) return fromEnv

  throw new Error(
    'Missing activation code: provide --activation-code, --activation-code-file, or NORDEA_CERT_ACTIVATION_CODE',
  )
}

function ensureSecureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true, mode: 0o700 })
  try {
    fs.chmodSync(dirPath, 0o700)
  } catch {
    // Best-effort; some filesystems may ignore chmod.
  }
}

function writeSensitiveFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, { encoding: 'utf8', mode: 0o600 })
  try {
    fs.chmodSync(filePath, 0o600)
  } catch {
    // Best-effort; some filesystems may ignore chmod.
  }
}

function printCertificateAndEnv(input: {
  privateKeyPem: string
  certPem: string
  workingDir: string
  printSecrets: boolean
}): void {
  const privateKeyPem = input.privateKeyPem
  const certPem = input.certPem
  const workingDir = input.workingDir
  const printSecrets = input.printSecrets

  const privateKeyPemB64 = base64NoWrap(Buffer.from(privateKeyPem, 'utf8'))
  const certPemB64 = base64NoWrap(Buffer.from(certPem, 'utf8'))
  const certFingerprintSha256 = sha256FingerprintHexFromCertPem(certPem)

  const privateKeyOutPath = path.join(workingDir, 'private-key.pem')
  const certificateOutPath = path.join(workingDir, 'certificate.pem')
  const envOutPath = path.join(workingDir, 'env.suggested')
  const fingerprintOutPath = path.join(workingDir, 'certificate.sha256')

  writeSensitiveFile(privateKeyOutPath, privateKeyPem.endsWith('\n') ? privateKeyPem : `${privateKeyPem}\n`)
  writeSensitiveFile(certificateOutPath, certPem.endsWith('\n') ? certPem : `${certPem}\n`)
  writeSensitiveFile(fingerprintOutPath, `${certFingerprintSha256}\n`)

  console.log('Certificate SHA-256 fingerprint:')
  console.log(certFingerprintSha256)

  const envOut = {
    NORDEA_SECURE_ENVELOPE_PRIVATE_KEY_PEM_B64: privateKeyPemB64,
    NORDEA_SECURE_ENVELOPE_CERTIFICATE_PEM_B64: certPemB64,
    NORDEA_TRUSTED_SIGNING_CERT_SHA256: certFingerprintSha256,
  }

  const envText = Object.entries(envOut)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')
  writeSensitiveFile(envOutPath, `${envText}\n`)

  console.log('\nWrote sensitive files:')
  console.log(`- ${privateKeyOutPath}`)
  console.log(`- ${certificateOutPath}`)
  console.log(`- ${envOutPath}`)
  console.log(`- ${fingerprintOutPath}`)

  if (printSecrets) {
    console.log('\nPrivate key (PEM):\n')
    console.log(privateKeyPem.trimEnd() + '\n')

    console.log('Certificate (PEM):\n')
    console.log(certPem.trimEnd() + '\n')

    console.log('Suggested env vars (copy to secret store):\n')
    for (const [k, v] of Object.entries(envOut)) {
      console.log(`${k}=${v}`)
    }
  } else {
    console.log('\nSecrets were NOT printed (default). Use --print-secrets to print them.')
  }

  console.log(`\nWorking dir: ${workingDir}`)
}

export async function runNordeaCertificateServiceCreateCertificate(rawArgv: string[] = process.argv.slice(2)) {
  const args = parseArgs(rawArgv)

  if (args.help) {
    usage()
    return
  }

  const recoverResponseFile = optionalString(args, 'recover-response-file')
  const recoverPrivateKeyPath = optionalString(args, 'recover-private-key-path')
  if (recoverResponseFile || recoverPrivateKeyPath) {
    if (!recoverResponseFile || !recoverPrivateKeyPath) {
      throw new Error('Recovery mode requires both --recover-response-file and --recover-private-key-path')
    }

    const printSecrets = args['print-secrets'] === true
    const outDirArg = optionalString(args, 'out-dir')
    const outDir = outDirArg
      ? path.resolve(process.cwd(), outDirArg)
      : path.join(process.cwd(), '.secrets', 'nordea-certificate', `recover-${Date.now()}`)
    ensureSecureDir(outDir)

    const responseXml = fs.readFileSync(recoverResponseFile, 'utf8')
    const privateKeyPem = fs.readFileSync(recoverPrivateKeyPath, 'utf8')
    writeSensitiveFile(path.join(outDir, 'recovered-response.xml'), responseXml)
    const parsed = parseNordeaCertificateServiceResponseXml(responseXml)

    if (parsed.certApplicationResponseXml) {
      writeSensitiveFile(path.join(outDir, 'recovered-cert-application-response.xml'), parsed.certApplicationResponseXml)
    }

    console.log('\n=== Nordea CertificateService recovery ===\n')
    console.log(`ResponseCode: ${parsed.responseCode ?? '(missing)'}`)
    console.log(`ResponseText: ${parsed.responseText ?? '(missing)'}`)

    if (!parsed.certificatePem) {
      throw new Error('Could not extract certificate from provided response file.')
    }

    printCertificateAndEnv({
      privateKeyPem,
      certPem: parsed.certificatePem,
      workingDir: outDir,
      printSecrets,
    })
    return
  }

  const activationCode = readActivationCode(args)
  const customerId = requireString(args, 'customer-id')
  const senderId =
    optionalString(args, 'sender-id') ??
    process.env.NORDEA_CA_WS_SENDER_ID?.trim() ??
    process.env.NORDEA_CA_CUSTOMER_ID?.trim() ??
    customerId
  const softwareId = requireString(args, 'software-id')
  const subjectCn = requireString(args, 'subject-cn')
  const subjectSerialNumber = requireString(args, 'subject-serial-number')
  const subjectCountryCode = validateCountryCode(requireString(args, 'subject-country-code'))

  const endpointUrl =
    optionalString(args, 'endpoint-url') ??
    'https://filetransfer.nordea.com/services/CertificateService/sha2'

  const soapAction = optionalString(args, 'soap-action')
  const requestId = optionalString(args, 'request-id') ?? crypto.randomBytes(16).toString('hex')
  const outDirArg = optionalString(args, 'out-dir')
  const printSecrets = args['print-secrets'] === true

  const keyBitsRaw = optionalString(args, 'key-bits') ?? '2048'
  const keyBits = Number.parseInt(keyBitsRaw, 10)
  if (!Number.isInteger(keyBits) || keyBits < 2048) {
    throw new Error(`Invalid --key-bits. Must be an integer >= 2048 (got ${keyBitsRaw})`)
  }

  const dryRun = args['dry-run'] === true

  const outDir = (() => {
    if (outDirArg) {
      const resolvedOutDir = path.resolve(process.cwd(), outDirArg)
      ensureSecureDir(resolvedOutDir)
      return resolvedOutDir
    }
    const defaultOutDir = path.join(process.cwd(), '.secrets', 'nordea-certificate', requestId)
    ensureSecureDir(defaultOutDir)
    return defaultOutDir
  })()

  try {
    const privateKeyPath = path.join(outDir, 'private-key.pem')
    const csrPemPath = path.join(outDir, 'request.csr.pem')
    const csrDerPath = path.join(outDir, 'request.csr.der')

    runOpenSsl('openssl', ['genpkey', '-algorithm', 'RSA', '-pkeyopt', `rsa_keygen_bits:${keyBits}`, '-out', privateKeyPath], outDir)

    const subject = `/C=${subjectCountryCode}/serialNumber=${subjectSerialNumber}/CN=${subjectCn}`
    runOpenSsl('openssl', ['req', '-new', '-sha256', '-key', privateKeyPath, '-subj', subject, '-out', csrPemPath], outDir)
    runOpenSsl('openssl', ['req', '-in', csrPemPath, '-outform', 'DER', '-out', csrDerPath], outDir)

    const privateKeyPem = fs.readFileSync(privateKeyPath, 'utf8')
    const csrDer = fs.readFileSync(csrDerPath)
    const csrDerBase64 = base64NoWrap(csrDer)

    const hmacBase64 = computeNordeaCertApplicationHmacBase64({
      csrDer,
      activationCode,
    })

    const certApplicationRequestXml = buildNordeaCertApplicationRequestXml({
      customerId,
      softwareId,
      environment: 'PRODUCTION',
      command: 'GetCertificate',
      service: 'service',
      csrDerBase64,
      hmacBase64,
      timestamp: new Date(),
    })

    if (dryRun) {
      console.log('\n=== Nordea CertificateService dry-run ===\n')
      console.log(`Endpoint: ${endpointUrl}`)
      console.log(`SOAPAction: ${soapAction ?? '(not set)'}`)
      console.log(`SenderId: ${senderId}`)
      console.log(`RequestId: ${requestId}`)
      console.log(`CustomerId: ${customerId}`)
      console.log(`SoftwareId: ${softwareId}`)
      console.log(`CSR subject: ${subject}`)
      if (optionalString(args, 'activation-code-file')) {
        console.log('Activation code source: file')
      } else if (optionalString(args, 'activation-code')) {
        console.log('Activation code source: cli argument')
      } else if (process.env.NORDEA_CERT_ACTIVATION_CODE?.trim()) {
        console.log('Activation code source: env var')
      }
      if (printSecrets) {
        console.log('\nCertApplicationRequest:\n')
        console.log(certApplicationRequestXml)
      } else {
        console.log('\nCertApplicationRequest XML not printed (default). Use --print-secrets to print it.')
      }
      console.log(`\nWorking dir (contains key/CSR): ${outDir}`)
      return
    }

    const response = await nordeaCertificateServiceGetCertificate(
      {
        endpointUrl,
        soapAction,
      },
      {
        senderId,
        requestId,
        certApplicationRequestXml,
      },
    )

    console.log('\n=== Nordea CertificateService response ===\n')
    console.log(`ResponseCode: ${response.responseCode ?? '(missing)'}`)
    console.log(`ResponseText: ${response.responseText ?? '(missing)'}`)

    writeSensitiveFile(path.join(outDir, 'certificate-service-response.xml'), response.responseXml)
    if (response.certApplicationResponseXml) {
      writeSensitiveFile(
        path.join(outDir, 'cert-application-response.xml'),
        response.certApplicationResponseXml,
      )
    }

    if (!response.certificatePem) {
      console.log('\nNo certificate Content element found in response.')
      if (printSecrets) {
        if (response.certApplicationResponseXml) {
          console.log('\nCertApplicationResponse (raw):\n')
          console.log(response.certApplicationResponseXml)
        } else {
          console.log('\nSOAP response (raw):\n')
          console.log(response.responseXml)
        }
      } else {
        console.log(
          'Raw response XML not printed (default). See certificate-service-response.xml in out-dir or use --print-secrets.',
        )
      }
      throw new Error('Nordea CertificateService did not return a certificate.')
    }

    printCertificateAndEnv({
      privateKeyPem,
      certPem: response.certificatePem,
      workingDir: outDir,
      printSecrets,
    })
    console.log('Working dir contains generated key, CSR, response XML, and output artifacts.')
  } catch (err) {
    console.error(String(err instanceof Error ? err.message : err))
    process.exitCode = 1
  }
}

const isDirectExecution = process.argv[1] === fileURLToPath(import.meta.url)

if (isDirectExecution) {
  // eslint-disable-next-line unicorn/prefer-top-level-await
  runNordeaCertificateServiceCreateCertificate()
}
