import crypto from 'node:crypto'
import process from 'node:process'
import db from '../../app/lib/db/index'
import { run } from '../../app/lib/db/schema/run'
import { submitErpPostingViaOutbox } from '../../engine/erp-integration/infrastructure/erpOutbox'
import { ingestErpResponses } from '../../engine/erp-integration/handlers/ingestErpResponses'

type Args = {
  ingestResponses: boolean
  deleteAfterPickup: boolean
  limitResponses: number
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    ingestResponses: false,
    deleteAfterPickup: false,
    limitResponses: 10,
  }

  for (const raw of argv) {
    if (raw === '--ingest-responses') {
      args.ingestResponses = true
      continue
    }
    if (raw === '--delete-after-pickup') {
      args.deleteAfterPickup = true
      continue
    }
    if (raw.startsWith('--limit-responses=')) {
      const parsed = Number.parseInt(raw.slice('--limit-responses='.length), 10)
      if (Number.isFinite(parsed) && parsed >= 0) {
        args.limitResponses = parsed
      }
      continue
    }
    if (raw === '--help' || raw === '-h') {
      printHelp()
      process.exit(0)
    }
  }

  return args
}

function printHelp(): void {
  console.log(`\nERP SFTP pipeline smoke test\n\nRuns the real ERP outbox upload pipeline (DB + XML build + SFTP upload).\n\nUsage:\n  pnpm -s smoke:erp:pipeline\n\nOptions:\n  --ingest-responses           Also pick up ERP response files from SFTP and store them in DB\n  --delete-after-pickup        When ingesting responses, delete remote files after pickup\n  --limit-responses=N          Max number of response files to pick up (default 10)\n`)
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))

  // Build a minimal, balanced posting document.
  // NOTE: Dimensions use the default DK labels expected by the KMD adapter
  // unless overridden via DB dimension definitions.
  const runId = crypto.randomUUID()
  const bookingDate = new Date()

  // Required for FK: erp_request.run_id -> run.id
  await db.insert(run).values({
    id: runId,
    bookingDate,
    status: 'indlæser',
  })

  const postings = [
    {
      amount: 1.23,
      debetOrCredit: 'Debet' as const,
      dimensions: {
        artskonto: '90515060',
        omkostningssted: '1000',
        'psp-element': 'XG-9999999990-00001',
      },
      text: `smoke test debit run=${runId}`,
    },
    {
      amount: 1.23,
      debetOrCredit: 'Kredit' as const,
      dimensions: {
        artskonto: '29505050',
        omkostningssted: '1000',
      },
      text: `smoke test credit run=${runId}`,
    },
  ]

  const result = await submitErpPostingViaOutbox({
    runId,
    bookingDate,
    postings,
  })

  console.log('ERP request uploaded', {
    requestId: result.requestId,
    filename: result.filename,
    remotePath: result.remotePath,
    lineCount: result.lineCount,
  })

  if (args.ingestResponses) {
    const ingestResult = await ingestErpResponses({
      limit: args.limitResponses,
      deleteAfterPickup: args.deleteAfterPickup,
    })

    console.log('ERP responses ingested', ingestResult)
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
