import { z } from 'zod'
import { eq, asc } from 'drizzle-orm'

import { loadNordeaRestEnv } from '../../engine/banking-ingestion/infrastructure/nordea/rest/env'
import { NordeaCorporateRestClient } from '../../engine/banking-ingestion/infrastructure/nordea/rest/client'
import { NORDEA_REST_AUTH_CURSOR_KEY } from '../../engine/banking-ingestion/infrastructure/nordea/rest/constants'
import { getAgreementCursor, setAgreementCursor } from '../../engine/banking-ingestion/handlers/bankingAgreementCursorStore'

type StoredNordeaRestAuthState = {
  status?: string | null
  accessId?: string | null
  clientToken?: string | null
  authorizationCode?: string | null
  accessToken?: string | null
  refreshToken?: string | null
  accessTokenExpiresAt?: string | null
  updatedAt?: string | null
}

const stateSchema = z
  .object({
    status: z.string().nullable().optional(),
    accessId: z.string().nullable().optional(),
    clientToken: z.string().nullable().optional(),
    authorizationCode: z.string().nullable().optional(),
    accessToken: z.string().nullable().optional(),
    refreshToken: z.string().nullable().optional(),
    accessTokenExpiresAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
  })
  .passthrough()

function nowIso() {
  return new Date().toISOString()
}

function safeParseCursor(value: string | null | undefined): StoredNordeaRestAuthState {
  if (!value) return {}
  try {
    return stateSchema.parse(JSON.parse(value))
  } catch {
    return {}
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function parseArgs(argv: string[]) {
  const flags = new Set(argv)
  const get = (name: string) => {
    const idx = argv.indexOf(name)
    if (idx === -1) return null
    return argv[idx + 1] ?? null
  }

  const mode = (get('--mode') ?? 'full') as 'full' | 'init' | 'poll'
  const iban = get('--iban')
  const databaseUrl = get('--database-url')
  const restartOnFailed = flags.has('--restart-on-failed')
  const maxPollSeconds = Number(get('--max-poll-seconds') ?? '180')
  const pollEveryMs = Number(get('--poll-every-ms') ?? '2000')

  const help = flags.has('--help') || flags.has('-h')

  return {
    help,
    mode,
    iban,
    databaseUrl,
    restartOnFailed,
    maxPollSeconds: Number.isFinite(maxPollSeconds) ? maxPollSeconds : 180,
    pollEveryMs: Number.isFinite(pollEveryMs) ? pollEveryMs : 2000,
  }
}

function printHelp() {
  // Keep this short; it will be shown in terminal.
  console.log(`Nordea REST smoke

Usage:
  pnpm -s tsx scripts/smoke/nordea-rest.ts --mode full
  pnpm -s tsx scripts/smoke/nordea-rest.ts --mode init
  pnpm -s tsx scripts/smoke/nordea-rest.ts --mode poll

Options:
  --mode full|init|poll        Default: full
  --iban <IBAN>                Optional: choose one allowlisted account
  --database-url <url>          Override DATABASE_URL (recommended when running outside docker compose)
  --restart-on-failed            If status becomes FAILED/REJECTED, create a new access request automatically
  --max-poll-seconds <n>        Default: 180
  --poll-every-ms <n>           Default: 2000

Notes:
  - Requires Nordea REST env vars (NORDEA_REST_*) and a running Postgres.
  - Repo default .env sets DATABASE_URL to host "db" (docker compose service). If you run from host, use --database-url or env override.
  - init: creates an access request and stores cursor (accessId/clientToken).
  - poll: polls status and exchanges code->token when ACTIVE.
  - full: init then poll then fetch accounts + sample transactions.
`)
}

function dbUrlHint(databaseUrl: string | undefined): string {
  if (!databaseUrl) return ''
  if (databaseUrl.includes('@db:')) {
    return 'Hint: DATABASE_URL points to host `db` (docker compose service). When running from host, use localhost: postgres://root:pass@localhost:5432/mydb'
  }
  return ''
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  if (args.databaseUrl) {
    process.env.DATABASE_URL = args.databaseUrl
  }

  // Lazy import db *after* DATABASE_URL override.
  const { default: db } = await import('../../app/lib/db/index')
  const { bankingAgreementAccountAllowlist } = await import(
    '../../app/lib/db/schema/bankingAgreementAccountAllowlist'
  )

  const loadOrInitState = async (): Promise<StoredNordeaRestAuthState> => {
    try {
      const cursor = await getAgreementCursor(db as any, {
        provider: 'nordea' as any,
        adapterKey: NORDEA_REST_AUTH_CURSOR_KEY,
      })
      return safeParseCursor(cursor?.value)
    } catch (err) {
      const url = process.env.DATABASE_URL
      const hint = dbUrlHint(url)
      const msg = String((err as any)?.message ?? err)
      throw new Error([`DB query failed (DATABASE_URL=${url ?? 'missing'})`, hint, msg].filter(Boolean).join('\n'))
    }
  }

  const saveState = async (state: StoredNordeaRestAuthState): Promise<void> => {
    await setAgreementCursor(db as any, {
      provider: 'nordea' as any,
      adapterKey: NORDEA_REST_AUTH_CURSOR_KEY,
      cursor: { value: JSON.stringify({ ...state, updatedAt: nowIso() }) },
    })
  }

  const env = loadNordeaRestEnv()
  const client = new NordeaCorporateRestClient({
    host: env.NORDEA_REST_HOST,
    clientId: env.NORDEA_REST_CLIENT_ID,
    clientSecret: env.NORDEA_REST_CLIENT_SECRET,
    eidasPrivateKeyPem: env.eidasPrivateKeyPem,
    timeoutMs: env.NORDEA_REST_TIMEOUT_MS,
  })

  let state = await loadOrInitState()

  const isTerminalFailureStatus = (status: string | null | undefined): boolean => {
    const s = String(status ?? '').trim().toUpperCase()
    return ['FAILED', 'REJECTED', 'DECLINED', 'DENIED', 'CANCELLED', 'CANCELED'].includes(s)
  }

  const doInit = async () => {
    console.log(`[init] Creating access request…`)
    const initiated = await client.initiateAuthorization({
      agreementNumber: env.NORDEA_REST_AGREEMENT_NUMBER,
      durationSeconds: env.NORDEA_REST_ACCESS_DURATION_SEC,
      scopes: env.scopes,
    })

    if (!initiated.accessId || !initiated.clientToken) {
      throw new Error('Nordea initiateAuthorization returned no access_id/client_token')
    }

    state = {
      ...state,
      status: initiated.status ?? null,
      accessId: initiated.accessId,
      clientToken: initiated.clientToken,
      authorizationCode: null,
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      updatedAt: nowIso(),
    }
    await saveState(state)

    if (state.status === 'CREATED') {
      console.log(`[init] Confirming access request…`)
      const confirmed = await client.confirmAuthorization({
        accessId: state.accessId,
        authorizerId: env.NORDEA_REST_AUTHORIZER_ID,
        bearerToken: state.clientToken,
      })
      state.status = confirmed.status ?? state.status ?? null
      await saveState(state)
    }

    console.log(`[init] accessId=${state.accessId} status=${state.status ?? 'null'}`)
    console.log(`[init] Approve in Nordea (netbank/app), then run with --mode poll (or wait if using --mode full).`)
  }

  const doPollAndExchange = async () => {
    if (!state.accessId || !state.clientToken) {
      throw new Error('Missing accessId/clientToken. Run with --mode init first.')
    }

    const deadline = Date.now() + args.maxPollSeconds * 1000
    while (Date.now() < deadline) {
      const polled = await client.getAuthorizationStatus({
        accessId: state.accessId,
        bearerToken: state.clientToken,
      })

      state.status = polled.status ?? state.status ?? null
      state.authorizationCode = polled.code ?? state.authorizationCode ?? null
      await saveState(state)

      console.log(`[poll] status=${state.status ?? 'null'} code=${state.authorizationCode ? 'present' : 'missing'}`)

      if (isTerminalFailureStatus(state.status)) {
        if (args.restartOnFailed) {
          console.log(`[poll] Status is ${state.status}. Restarting by creating a new access request…`)
          await doInit()
          // Ensure we have fresh accessId/clientToken for the next loop iteration.
          if (!state.accessId || !state.clientToken) {
            throw new Error('Restart requested but accessId/clientToken are missing after init')
          }
          // Continue polling on the new request.
          continue
        }
        throw new Error(
          `Authorization status is ${state.status}. Run: pnpm -s smoke:banking:nordea:rest -- --mode init --database-url <...> (or add --restart-on-failed).`,
        )
      }

      if (state.status === 'EXPIRED') {
        throw new Error('Authorization expired')
      }

      if (state.status === 'ACTIVE') {
        if (!state.authorizationCode) {
          throw new Error('Status ACTIVE but no authorization code returned (docs require code for token exchange)')
        }
        console.log('[poll] Exchanging code for tokens…')
        const exchanged = await client.exchangeAuthorizationCodeForTokens({ code: state.authorizationCode })

        const raw = exchanged.raw as any
        const expiresIn = typeof raw?.response?.expires_in === 'number' ? raw.response.expires_in : null
        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null

        state.status = 'COMPLETED'
        state.accessToken = exchanged.tokens.accessToken
        state.refreshToken = exchanged.tokens.refreshToken
        state.accessTokenExpiresAt = expiresAt
        await saveState(state)

        console.log('[poll] Token exchange completed (tokens stored in banking_agreement_cursor).')
        return
      }

      await sleep(args.pollEveryMs)
    }

    throw new Error(`Polling timed out after ${args.maxPollSeconds}s`) 
  }

  if (args.mode === 'init') {
    await doInit()
    return
  }

  if (args.mode === 'poll') {
    await doPollAndExchange()
    return
  }

  // full
  await doInit()
  await doPollAndExchange()

  if (!state.accessToken) {
    throw new Error('No access token after poll/exchange')
  }

  console.log('[data] Listing accounts (paged)…')
  const allAccounts: unknown[] = []
  let page = 1
  let guard = 0
  while (guard < 50) {
    guard += 1
    const res = await client.listAccounts({ bearerToken: state.accessToken, page, size: 30 })
    allAccounts.push(...res.accounts)
    if (!res.nextPage) break
    page = res.nextPage
  }
  console.log(`[data] accounts=${allAccounts.length}`)

  // Pick one allowlisted IBAN (or --iban)
  const allowlisted = await db
    .select({ iban: bankingAgreementAccountAllowlist.iban })
    .from(bankingAgreementAccountAllowlist)
    .where(eq(bankingAgreementAccountAllowlist.provider, 'nordea' as any))
    .orderBy(asc(bankingAgreementAccountAllowlist.iban))

  const iban = (args.iban ?? allowlisted[0]?.iban ?? '').trim()
  if (!iban) {
    console.log('[data] No allowlisted IBAN found; skipping transactions fetch.')
    return
  }

  const findAccountRef = (): string | null => {
    const needle = iban.replace(/\s+/g, '').toUpperCase()
    for (const a of allAccounts as any[]) {
      const candidate =
        (a?.iban ?? a?.IBAN ?? a?.bankAccount ?? a?.bank_account ?? '').toString().trim()
      if (!candidate) continue
      if (candidate.replace(/\s+/g, '').toUpperCase() === needle) {
        return (a?._id ?? a?.bankAccount ?? a?.bank_account ?? a?.account_id ?? a?.accountId ?? candidate).toString()
      }
    }
    return null
  }

  const accountRef = findAccountRef()
  if (!accountRef) {
    console.log(`[data] Allowlisted IBAN not found in accounts response: ${iban}`)
    return
  }

  const today = new Date()
  const dateOnly = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, '0')}-${String(today.getUTCDate()).padStart(2, '0')}`

  console.log(`[data] Listing transactions for ${iban} (accountRef=${accountRef}) date=${dateOnly}…`)
  const firstPage = await client.listTransactions({
    bearerToken: state.accessToken,
    accountRef,
    fromDate: dateOnly,
    toDate: dateOnly,
  })

  console.log(`[data] transactions_page_1=${firstPage.transactions.length} continuationKey=${firstPage.continuationKey ? 'present' : 'none'}`)
}

main().catch((err) => {
  console.error(String((err as any)?.stack ?? (err as any)?.message ?? err))
  process.exitCode = 1
})
