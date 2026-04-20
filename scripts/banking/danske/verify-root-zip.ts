import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'

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

function optionalString(args: Args, key: string): string | undefined {
  const v = args[key]
  if (typeof v !== 'string') return undefined
  const t = v.trim()
  return t.length ? t : undefined
}

function isUrl(s: string): boolean {
  return /^https?:\/\//i.test(s)
}

function commandExists(cmd: string): boolean {
  const res = spawnSync('sh', ['-lc', `command -v ${cmd} >/dev/null 2>&1`])
  return res.status === 0
}

function run(cmd: string, args: string[], opts?: { cwd?: string; allowFailure?: boolean }) {
  const res = spawnSync(cmd, args, { cwd: opts?.cwd, encoding: 'utf8' })
  if (res.status !== 0 && !opts?.allowFailure) {
    const stderr = (res.stderr || '').trim()
    const stdout = (res.stdout || '').trim()
    throw new Error(`${cmd} ${args.join(' ')} failed\n${stderr || stdout}`)
  }
  return res
}

function sha256Hex(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex')
}

function normalizeDn(dn: string): string {
  return dn.replace(/\s+/g, ' ').trim()
}

async function downloadToTemp(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed: HTTP ${res.status} ${res.statusText}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const outPath = path.join(os.tmpdir(), `danske-root-${Date.now()}.zip`)
  fs.writeFileSync(outPath, buf, { mode: 0o600 })
  return outPath
}

function findSignedByLines(jarsignerOutput: string): string[] {
  const lines = jarsignerOutput.split(/\r?\n/)
  return lines
    .map(l => l.trim())
    .filter(l => l.toLowerCase().includes('signed by'))
}

function extractZipEntries(zipPath: string): string[] {
  // unzip -Z1 prints entry names one per line
  const res = run('unzip', ['-Z1', zipPath])
  return (res.stdout || '')
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean)
}

function extractZipFile(zipPath: string, entryName: string): Buffer {
  const res = run('unzip', ['-p', zipPath, entryName])
  return Buffer.from(res.stdout ?? '', 'binary')
}

function parseX509FromDer(der: Buffer): crypto.X509Certificate {
  // Node can parse DER buffers directly.
  return new crypto.X509Certificate(der)
}

function fingerprint256NoColons(x509: crypto.X509Certificate): string {
  return (x509.fingerprint256 || '').replace(/:/g, '').toLowerCase()
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const defaultZipUrl =
    'https://danskeci.com/-/media/pdf/danskeci-com/danske-bank-web-services/dbgroot_1111110003.zip?rev=04a4beccd8764ae994a8e4beb6889cc0&hash=A66D9AD03AE3A6B8010430D29CC32250'

  const zipArg = optionalString(args, 'zip') ?? defaultZipUrl
  const expectedSignerDn = optionalString(args, 'expected-signer-dn')

  if (args.help) {
    console.log(`\nVerify Danske Bank root ZIP (DBGROOT_1111110003.zip)\n\nWhat it does:\n  1) Runs: jarsigner -verify -verbose <zip>\n  2) Requires that the ZIP is verified and signed by Danske Bank A/S\n  3) Extracts *.cer from the ZIP and prints certificate metadata + SHA-256 fingerprint\n\nUsage:\n  pnpm tsx scripts/banking/danske/verify-root-zip.ts [--zip <path-or-url>] [--expected-signer-dn "..."]\n\nDefaults:\n  --zip: Danske's published DBGROOT_1111110003.zip URL\n  --expected-signer-dn: (if omitted) checks for tokens: CN=Danske Bank A/S, O=Danske Bank A/S, C=DK\n`)
    return
  }

  if (!commandExists('jarsigner')) {
    throw new Error('jarsigner not found. Install a JDK (jarsigner is part of it) and retry.')
  }
  if (!commandExists('unzip')) {
    throw new Error('unzip not found. Install unzip and retry.')
  }

  const zipPath = isUrl(zipArg) ? await downloadToTemp(zipArg) : zipArg
  if (!fs.existsSync(zipPath)) throw new Error(`ZIP not found: ${zipPath}`)

  const verifyRes = run('jarsigner', ['-verify', '-verbose', zipPath], { allowFailure: true })
  const out = `${verifyRes.stdout ?? ''}\n${verifyRes.stderr ?? ''}`

  const verified = /\bjar verified\b\.?/i.test(out) && verifyRes.status === 0
  if (!verified) {
    throw new Error(`Root ZIP signature verification failed (expected jarsigner to end with "jar verified.")\n\n${out.trim()}`)
  }

  const signedByLines = findSignedByLines(out)
  const signedByJoined = normalizeDn(signedByLines.join(' | '))

  const tokensOk =
    signedByJoined.toLowerCase().includes('cn=danske bank a/s') &&
    signedByJoined.toLowerCase().includes('o=danske bank a/s') &&
    signedByJoined.toLowerCase().includes('c=dk')

  if (expectedSignerDn) {
    const expectedNorm = normalizeDn(expectedSignerDn)
    if (!signedByJoined.includes(expectedNorm)) {
      throw new Error(
        `ZIP is verified but signer DN did not match expected value.\nExpected (substring): ${expectedNorm}\nGot: ${signedByJoined || '(no Signed by lines found)'}`,
      )
    }
  } else if (!tokensOk) {
    throw new Error(
      `ZIP is verified but signer does not look like Danske Bank A/S.\nSigned-by lines: ${signedByJoined || '(none found)'}`,
    )
  }

  const entries = extractZipEntries(zipPath)
  const cerEntries = entries.filter(e => e.toLowerCase().endsWith('.cer'))
  if (cerEntries.length === 0) {
    throw new Error(`ZIP verified, but contained no .cer files. Entries: ${entries.join(', ')}`)
  }

  console.log('\n=== Danske Bank root ZIP verification OK ===')
  console.log(`ZIP: ${zipPath}`)
  console.log(`Signed-by: ${signedByJoined}`)

  for (const entry of cerEntries) {
    // unzip -p returns binary; Node will put it in stdout as a string, which can corrupt.
    // Workaround: extract via a temp file using unzip -p redirection.
    const tmpCerPath = path.join(os.tmpdir(), `danske-${path.basename(entry)}-${Date.now()}`)
    run('sh', ['-lc', `unzip -p "${zipPath}" "${entry}" > "${tmpCerPath}"`])
    const der = fs.readFileSync(tmpCerPath)

    const x509 = parseX509FromDer(der)
    const fileSha256Hex = sha256Hex(der)
    const certSha256Hex = sha256Hex(x509.raw)

    console.log(`\nCertificate entry: ${entry}`)
    console.log(`Subject: ${x509.subject}`)
    console.log(`Issuer: ${x509.issuer}`)
    console.log(`Serial (hex): ${x509.serialNumber}`)
    console.log(`Valid from: ${x509.validFrom}`)
    console.log(`Valid to: ${x509.validTo}`)
    console.log(`SHA-256 fingerprint (certificate DER, hex): ${certSha256Hex}`)
    if (fileSha256Hex !== certSha256Hex) {
      console.log(`Note: file SHA-256 differs (file may include wrapper/extra bytes): ${fileSha256Hex}`)
    }

    const fp256 = fingerprint256NoColons(x509)
    if (fp256 && fp256 !== certSha256Hex) {
      console.log(`Note: Node fingerprint256 differs from DER hash; prefer the DER hash above.`)
      console.log(`Node fingerprint256 (no colons): ${fp256}`)
    }

    const selfSigned = normalizeDn(x509.subject) === normalizeDn(x509.issuer)
    if (!selfSigned) {
      console.log('WARNING: certificate is not self-signed (subject != issuer). Verify that this is expected.')
    }

    try {
      fs.unlinkSync(tmpCerPath)
    } catch {
      // ignore
    }
  }

  console.log('\nNext step (per Danske guide): call PKIWS GetBankCertificate using the serial (e.g. 1111110003).')
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((e) => {
  console.error(String(e instanceof Error ? e.message : e))
  process.exitCode = 1
})
