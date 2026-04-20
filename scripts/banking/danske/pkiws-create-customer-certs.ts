import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'

import {
  danskePkiCreateCertificate,
  danskePkiGetBankCertificates,
} from '../../../engine/banking-ingestion/infrastructure/danskebank/pkiWsClient'
import { sha256FingerprintHexFromCertPem } from '../../../engine/banking-ingestion/infrastructure/bxd/xmlDsig'

type Args = Record<string, string | boolean>

function parseArgs(argv: string[]): Args {
  const out: Args = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
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
      i++
    }
  }
  return out
}

function requireString(args: Args, key: string): string {
  const v = args[key]
  if (typeof v === 'string' && v.trim().length > 0) return v.trim()

  const envKeys =
    key === 'pin'
      ? ['DANSKE_BANK_PKI_PIN', 'DANSKE_PKI_PIN']
      : key === 'pki-sender-id'
        ? ['DANSKE_BANK_PKI_SENDER_ID', 'DANSKE_PKI_SENDER_ID']
        : key === 'pki-customer-id'
          ? ['DANSKE_BANK_PKI_CUSTOMER_ID', 'DANSKE_PKI_CUSTOMER_ID']
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
  return trimmed.length ? trimmed : undefined
}

function mapModeToPkiEnvironment(mode: string): 'customertest' | 'production' {
  const m = mode.trim().toUpperCase()
  if (m === 'TEST' || m === 'CUSTOMERTEST') return 'customertest'
  if (m === 'PRODUCTION' || m === 'PROD') return 'production'
  throw new Error(
    `Invalid --mode. Use CUSTOMERTEST (alias TEST) or PRODUCTION (alias PROD) (got ${mode})`,
  )
}

function base64NoWrap(buf: Buffer): string {
  return buf.toString('base64')
}

function sha256Hex(s: string): string {
  return crypto.createHash('sha256').update(s).digest('hex')
}

function runOpenSsl(cmd: string, args: string[], cwd: string) {
  const res = spawnSync(cmd, args, { cwd, encoding: 'utf8' })
  if (res.status !== 0) {
    const stderr = (res.stderr || '').trim()
    const stdout = (res.stdout || '').trim()
    throw new Error(`OpenSSL failed: ${cmd} ${args.join(' ')}\n${stderr || stdout}`)
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    console.log(`\nDanske Bank PKIWS: Create customer certificates (signing + encryption)\n\nUsage:\n  pnpm tsx scripts/banking/danske/pkiws-create-customer-certs.ts \\\n    --mode CUSTOMERTEST|PRODUCTION \\\n    --pin <PIN_FROM_DANSKE> \\\n    --pki-sender-id <PKI_SENDER_ID> \\\n    --pki-customer-id <PKI_CUSTOMER_ID> \\\n    --subject-cn "Randers Kommune" \\\n    [--key-bits 2048] \\\n    [--pki-endpoint-url https://.../pkiservice.asmx] \\\n    [--bank-root-serial 1111110003]\n\nMode aliases:\n  TEST == CUSTOMERTEST\n  PROD == PRODUCTION\n\nQuick smoke test (PKIWS doc dummy mode, no args):\n  pnpm banking:danske:pkiws:smoke-docs\n\nShortcut (recommended):\n  pnpm banking:danske:pkiws:create-customer-certs -- <same args>\n\nEnv var shortcuts (preferred first):\n  DANSKE_BANK_PKI_PIN\n  DANSKE_BANK_PKI_SENDER_ID\n  DANSKE_BANK_PKI_CUSTOMER_ID\n\nCompatibility (also accepted):\n  DANSKE_PKI_PIN\n  DANSKE_PKI_SENDER_ID\n  DANSKE_PKI_CUSTOMER_ID\n\nExample (customertest):\n  pnpm banking:danske:pkiws:create-customer-certs -- \\\n    --mode customertest \\\n    --pin "123456" \\\n    --pki-sender-id "5Q4192" \\\n    --pki-customer-id "351340" \\\n    --subject-cn "Randers Kommune"\n\nOptions:\n  --doc-smoke-test       Run the spec's dummy checks against the customer test environment\n  --only-get-bank-certs  Only call GetBankCertificate (no PIN, no key/CSR)\n  --confirm-production   Required to call CreateCertificate in production\n\nOutputs:\n  - Private key PEM + base64\n  - Signing certificate PEM + base64\n  - Encryption certificate PEM + base64\n  - Suggested env vars for runtime\n\nSECURITY NOTE:\n  This prints secrets to stdout. Run it in a safe terminal and store outputs immediately.\n`)
    return
  }

  const isDocSmokeTest = args['doc-smoke-test'] === true
  const onlyGetBankCerts = args['only-get-bank-certs'] === true

  if (isDocSmokeTest) {
    // Per PKIWS spec: test-mode is activated with Environment='customertest'.
    // Dummy behavior: PIN 1234 gives a valid response; CSRs starting with 'M' are accepted.
    // Also avoid the CustomerId value documented as "not authorized".
    const docDummyCustomerId = '207162'

    if (typeof args.mode !== 'string') args.mode = 'customertest'
    if (typeof args.pin !== 'string') args.pin = '1234'
    if (typeof args['pki-sender-id'] !== 'string') args['pki-sender-id'] = docDummyCustomerId
    if (typeof args['pki-customer-id'] !== 'string') args['pki-customer-id'] = docDummyCustomerId
    if (typeof args['subject-cn'] !== 'string') args['subject-cn'] = 'PKIWS doc smoke test'
    if (typeof args['bank-root-serial'] !== 'string') args['bank-root-serial'] = '1111110003'
  }

  const mode = requireString(args, 'mode')
  const pkiEnvironment = mapModeToPkiEnvironment(mode)

  const pkiSenderId = requireString(args, 'pki-sender-id')
  const pkiCustomerId = requireString(args, 'pki-customer-id')

  const pkiEndpointUrl =
    optionalString(args, 'pki-endpoint-url') ??
    'https://businessws.danskebank.com/ra/pkiservice.asmx'

  const bankRootSerial = optionalString(args, 'bank-root-serial') ?? '1111110003'

  if (onlyGetBankCerts) {
    const bankCerts = await danskePkiGetBankCertificates({
      endpointUrl: pkiEndpointUrl,
      senderId: pkiSenderId,
      customerId: pkiCustomerId,
      interfaceVersion: '1',
      environment: pkiEnvironment,
      bankRootCertificateSerialNo: bankRootSerial,
    })

    console.log('\n=== Danske PKIWS GetBankCertificate OK ===\n')
    console.log(`Environment: ${pkiEnvironment}`)
    console.log(`BankRootCertificateSerialNo: ${bankRootSerial}`)

    console.log('\nBank signing certificate SHA-256 fingerprint:')
    console.log(sha256FingerprintHexFromCertPem(bankCerts.bankSigningCertificatePem))

    return
  }

  if (pkiEnvironment === 'production' && args['confirm-production'] !== true) {
    throw new Error(
      'Refusing to call CreateCertificate in production without --confirm-production (this can issue real certificates and consume the PIN).',
    )
  }

  const pin = requireString(args, 'pin')

  const subjectCn = optionalString(args, 'subject-cn') ?? 'Municipality'
  const keyBitsRaw = optionalString(args, 'key-bits') ?? '2048'
  const keyBits = Number.parseInt(keyBitsRaw, 10)
  if (!Number.isInteger(keyBits) || keyBits < 2048) {
    throw new Error(`Invalid --key-bits. Must be an integer >= 2048 (got ${keyBitsRaw})`)
  }

  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'danske-pkiws-'))
  try {
    const privateKeyPath = path.join(outDir, 'private-key.pem')
    const csrPath = path.join(outDir, 'request.csr.pem')
    const csrDerPath = path.join(outDir, 'request.csr.der')

    // Generate one RSA key and reuse it for both CSR fields.
    // This keeps runtime simple because we only need one private key.
    runOpenSsl('openssl', ['genpkey', '-algorithm', 'RSA', '-pkeyopt', `rsa_keygen_bits:${keyBits}`, '-out', privateKeyPath], outDir)

    // Minimal subject: CN only.
    runOpenSsl('openssl', ['req', '-new', '-key', privateKeyPath, '-subj', `/CN=${subjectCn}`, '-out', csrPath], outDir)
    runOpenSsl('openssl', ['req', '-in', csrPath, '-outform', 'DER', '-out', csrDerPath], outDir)

    const privateKeyPem = fs.readFileSync(privateKeyPath, 'utf8')
    const csrDer = fs.readFileSync(csrDerPath)
    const csrPkcs10B64 = base64NoWrap(csrDer)

    // 2) Get bank certs
    const bankCerts = await danskePkiGetBankCertificates({
      endpointUrl: pkiEndpointUrl,
      senderId: pkiSenderId,
      customerId: pkiCustomerId,
      interfaceVersion: '1',
      environment: pkiEnvironment,
      bankRootCertificateSerialNo: bankRootSerial,
    })

    // 3) Create customer certs (using same CSR for both)
    const created = await danskePkiCreateCertificate({
      config: {
        endpointUrl: pkiEndpointUrl,
        senderId: pkiSenderId,
        customerId: pkiCustomerId,
        interfaceVersion: '1',
        environment: pkiEnvironment,
        bankRootCertificateSerialNo: bankRootSerial,
      },
      bankEncryptionCertificatePem: bankCerts.bankEncryptionCertificatePem,
      input: {
        encryptionCertPkcs10: csrPkcs10B64,
        signingCertPkcs10: csrPkcs10B64,
        pin,
        keyGeneratorType: 'software',
      },
    })

    // Print results. (Do not write secrets to repo)
    const privateKeyB64 = base64NoWrap(Buffer.from(privateKeyPem, 'utf8'))
    const signingCertPem = created.signingCertificatePem
    const encryptionCertPem = created.encryptionCertificatePem

    const signingCertB64 = base64NoWrap(Buffer.from(signingCertPem, 'utf8'))
    const encryptionCertB64 = base64NoWrap(Buffer.from(encryptionCertPem, 'utf8'))

    const bankSigningFingerprintSha256Hex = sha256FingerprintHexFromCertPem(bankCerts.bankSigningCertificatePem)

    if (isDocSmokeTest) {
      console.log('\n=== Danske PKIWS doc smoke test OK ===\n')
      console.log(`Environment: ${pkiEnvironment}`)

      console.log('\nBank signing certificate SHA-256 fingerprint:')
      console.log(bankSigningFingerprintSha256Hex)

      console.log('\nCustomer signing certificate SHA-256 fingerprint:')
      console.log(sha256FingerprintHexFromCertPem(signingCertPem))

      console.log('\nCustomer encryption certificate SHA-256 fingerprint:')
      console.log(sha256FingerprintHexFromCertPem(encryptionCertPem))

      console.log(`\nTemp working dir (contains key/CSR): ${outDir}`)
      console.log('Delete it when you are done debugging.')
      return
    }

    // Suggested env vars (runtime uses one key + one cert).
    // Use signing cert for signatures; bank encrypts responses to the *encryption* cert.
    // Because we re-used the same keypair, the one private key can decrypt responses.
    const envOut = {
      DANSKE_BANK_APPLICATION_REQUEST_PRIVATE_KEY_PEM_B64: privateKeyB64,
      DANSKE_BANK_APPLICATION_REQUEST_CERTIFICATE_PEM_B64: signingCertB64,
      DANSKE_BANK_TRUSTED_SIGNING_CERT_SHA256: bankSigningFingerprintSha256Hex,
    }

    console.log('\n=== Danske PKIWS customer certs created ===\n')

    console.log('Private key (PEM):\n')
    console.log(privateKeyPem.trimEnd() + '\n')

    console.log('Signing certificate (PEM):\n')
    console.log(signingCertPem.trimEnd() + '\n')

    console.log('Encryption certificate (PEM):\n')
    console.log(encryptionCertPem.trimEnd() + '\n')

    console.log('Bank signing certificate SHA-256 fingerprint (pin this in runtime):')
    console.log(bankSigningFingerprintSha256Hex)

    console.log('\nEncryption certificate (B64, for your records; not used as an env var in runtime):')
    console.log(encryptionCertB64)

    console.log('\nSuggested env vars (copy into secret store):\n')
    for (const [k, v] of Object.entries(envOut)) {
      console.log(`${k}=${v}`)
    }

    console.log(`\nTemp working dir (contains key/CSR): ${outDir}`)
    console.log('Delete it when you have stored the outputs safely.')
  } catch (e) {
    console.error(String(e instanceof Error ? e.message : e))
    process.exitCode = 1
  }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main()
