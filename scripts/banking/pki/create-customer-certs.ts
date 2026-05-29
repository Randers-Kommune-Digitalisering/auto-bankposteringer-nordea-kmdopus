import { runDanskePkiCreateCustomerCerts } from '../danske/pkiws-create-customer-certs'
import { runNordeaCertificateServiceCreateCertificate } from '../nordea/certificate-service-create-certificate'

type Provider = 'danske' | 'nordea'

function providerFromArg(value: string | null | undefined): Provider {
  const v = String(value ?? '').trim().toLowerCase()
  if (v === 'danske' || v === 'danskebank') return 'danske'
  if (v === 'nordea') return 'nordea'
  throw new Error(`Invalid --provider value: ${String(value ?? '')}. Use danske or nordea.`)
}

function parseProvider(argv: string[]): { provider: Provider | null; forwardedArgv: string[] } {
  const forwardedArgv: string[] = []
  let provider: Provider | null = null

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]!

    if (token === '--provider') {
      provider = providerFromArg(argv[i + 1])
      i += 1
      continue
    }

    if (token.startsWith('--provider=')) {
      provider = providerFromArg(token.slice('--provider='.length))
      continue
    }

    forwardedArgv.push(token)
  }

  return { provider, forwardedArgv }
}

function printCommonHelp() {
  console.log(`\nCreate customer certificates (provider-dispatch)\n\nUsage:\n  pnpm banking:pki:create-customer-certs -- --provider danske <provider options>\n  pnpm banking:pki:create-customer-certs -- --provider nordea <provider options>\n\nProviders:\n  danske   Implemented (forwards to existing Danske PKIWS script)\n  nordea   Implemented as best effort from Nordea public Certificate Management docs\n\nExamples:\n  pnpm banking:pki:create-customer-certs -- --provider danske --mode customertest --pin \"123456\" --pki-sender-id \"5Q4192\" --pki-customer-id \"351340\" --subject-cn \"Randers Kommune\"\n  pnpm banking:pki:create-customer-certs -- --provider nordea --activation-code-file .secrets/nordea-certificate/activation-code.txt --customer-id \"5780860238\" --software-id \"ABP\" --subject-serial-number \"5780860238\" --subject-country-code \"DK\" --subject-cn \"Randers Kommune\" --out-dir .secrets/nordea-certificate/current\n\nNotes:\n  - Secure default: secrets are written to files and not printed to terminal unless --print-secrets is set.\n  - Keep outputs in approved secret store; do not commit them to git.\n`)
}

function printNordeaHelp() {
  console.log(`\nNordea certificate enrollment (best effort)\n\nCurrent status:\n  - Nordea CorporateFileService SOAP client is implemented for CAMT.053 file download.\n  - Runtime env loading expects existing key/certificate material.\n  - CertificateService flow is implemented from public documentation and may require endpoint/SOAPAction adjustments if bank setup differs.\n\nRelevant docs provided by you:\n  - https://www.nordea.com/en/doc/corporate-access-file-transfer-certificate-management-v3.pdf\n  - https://www.nordea.com/en/doc/web-services-service-description-for-ca-v1.pdf\n\nNordea provider inputs:\n  [--activation-code <temporary code from Nordea> | --activation-code-file <path>]\n  --customer-id <agreement customer id>\n  --software-id <software id>\n  --subject-serial-number <SignerID>\n  --subject-country-code <DK|FI|NO|SE>\n  --subject-cn \"Randers Kommune\"\n  [--endpoint-url https://filetransfer.nordea.com/services/CertificateService/sha2]\n  [--soap-action \"\"]\n  [--out-dir .secrets/nordea-certificate/current]\n  [--print-secrets]\n  [--dry-run]\n\nFlow:\n  1) Generate keypair/CSR locally with openssl.\n  2) Build CertApplicationRequest with CSR + HMAC from activation code.\n  3) Submit SOAP request to CertificateService.\n  4) Save key/cert/response files in out-dir and apply env vars.\n`)
}

async function main() {
  const argv = process.argv.slice(2)
  const { provider, forwardedArgv } = parseProvider(argv)

  const wantsHelp = forwardedArgv.includes('--help') || forwardedArgv.includes('-h')

  if (!provider) {
    printCommonHelp()
    if (wantsHelp) return
    throw new Error('Missing required argument: --provider danske|nordea')
  }

  if (provider === 'danske') {
    await runDanskePkiCreateCustomerCerts(forwardedArgv)
    return
  }

  if (provider === 'nordea') {
    if (wantsHelp) {
      printNordeaHelp()
      return
    }
    await runNordeaCertificateServiceCreateCertificate(forwardedArgv)
    return
  }

  throw new Error('Unsupported provider')
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main()
