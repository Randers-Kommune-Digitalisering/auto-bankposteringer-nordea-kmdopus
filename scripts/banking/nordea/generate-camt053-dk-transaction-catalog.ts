import fs from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const SOURCE_URL = 'https://www.nordea.com/en/doc/nordea-caar-camt.053.001.02-account-statement-extended-0.pdf'
const DEFAULT_PDF = '/tmp/nordea-caar-camt.053.001.02-account-statement-extended-0.pdf'
const DEFAULT_OUTPUT = 'resources/banking/nordea/transaction-code-catalog.dk.csv'

type CatalogRow = {
  provider: 'nordea'
  codeKey: string
  displayName: string
  domain: string
  family: string
  subFamily: string
  proprietary: string
  description: string
  sourceDocument: string
  isActive: 'true'
}

function normalizeCell(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function csvEscape(value: string): string {
  const needsQuotes = /[",\n]/.test(value)
  const escaped = value.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

function extractDisplayName(line: string, codeIndex: number): string {
  const textPart = line.slice(0, codeIndex).trimEnd()
  if (!textPart) return ''
  const parts = textPart
    .split(/\s{2,}|\t+/)
    .map((p) => normalizeCell(p))
    .filter(Boolean)
  if (!parts.length) return normalizeCell(textPart)
  return parts[parts.length - 1] ?? normalizeCell(textPart)
}

function hasDenmarkFlag(line: string, denmarkIndex: number): boolean {
  if (denmarkIndex < 0) return false
  const from = Math.max(0, denmarkIndex - 1)
  const to = Math.min(line.length, denmarkIndex + 7)
  return line.slice(from, to).includes('Y')
}

function parseRows(layoutText: string): CatalogRow[] {
  const lines = layoutText.split(/\r?\n/)
  const rows = new Map<string, CatalogRow>()

  let denmarkIndex = -1

  for (const line of lines) {
    if (line.includes('Denmark') && line.includes('Finland') && line.includes('Norway') && line.includes('Sweden')) {
      denmarkIndex = line.indexOf('Denmark')
      continue
    }

    if (denmarkIndex < 0) continue

    const codeMatches = [...line.matchAll(/\b[A-Z0-9]{4}\b/g)]
    if (codeMatches.length < 3) continue

    const lastThree = codeMatches.slice(-3)
    const domain = lastThree[0]?.[0] ?? ''
    const family = lastThree[1]?.[0] ?? ''
    const subFamily = lastThree[2]?.[0] ?? ''
    const codeIndex = lastThree[0]?.index ?? -1

    if (!domain || !family || !subFamily || codeIndex < 0) continue
    if (!hasDenmarkFlag(line, denmarkIndex)) continue

    const codeKey = `${domain}/${family}/${subFamily}`
    const parsedDisplayName = extractDisplayName(line, codeIndex)
    const displayName = parsedDisplayName || codeKey

    if (!rows.has(codeKey)) {
      rows.set(codeKey, {
        provider: 'nordea',
        codeKey,
        displayName,
        domain,
        family,
        subFamily,
        proprietary: '',
        description: 'DK=Y from MIG camt.053.001.02 Account Statement Extended',
        sourceDocument: SOURCE_URL,
        isActive: 'true',
      })
    }
  }

  return Array.from(rows.values()).sort((a, b) => a.codeKey.localeCompare(b.codeKey))
}

async function ensurePdf(pdfPath: string) {
  try {
    await fs.access(pdfPath)
    return
  } catch {
    execFileSync('curl', ['-L', '-s', '-o', pdfPath, SOURCE_URL], { stdio: 'inherit' })
  }
}

async function main() {
  const pdfPath = path.resolve(process.cwd(), process.argv[2] ?? DEFAULT_PDF)
  const outputPath = path.resolve(process.cwd(), process.argv[3] ?? DEFAULT_OUTPUT)

  await ensurePdf(pdfPath)

  const layoutText = execFileSync('pdftotext', ['-layout', pdfPath, '-'], { encoding: 'utf8' })
  const rows = parseRows(layoutText)

  const header = 'provider,codeKey,displayName,domain,family,subFamily,proprietary,description,sourceDocument,isActive'
  const lines = rows.map((row) => [
    row.provider,
    row.codeKey,
    row.displayName,
    row.domain,
    row.family,
    row.subFamily,
    row.proprietary,
    row.description,
    row.sourceDocument,
    row.isActive,
  ].map(csvEscape).join(','))

  await fs.writeFile(outputPath, `${header}\n${lines.join('\n')}\n`, 'utf8')

  // eslint-disable-next-line no-console
  console.log(`[generate-camt053-dk-transaction-catalog] wrote ${rows.length} rows to ${path.relative(process.cwd(), outputPath)}`)
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[generate-camt053-dk-transaction-catalog] failed', error)
  process.exitCode = 1
})
