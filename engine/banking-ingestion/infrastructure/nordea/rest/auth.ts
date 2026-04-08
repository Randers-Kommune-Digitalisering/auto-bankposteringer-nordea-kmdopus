import { z } from 'zod'
import { logger } from '~/lib/logger'

import type { BankCursor } from '../../../ports/bankAdapter'
import { getAgreementCursor, setAgreementCursor } from '../../../handlers/bankingAgreementCursorStore'

import type { NordeaCorporateRestClient } from './client'
import { NORDEA_REST_AUTH_CURSOR_KEY } from './constants'

const storedSchema = z
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

type StoredNordeaRestAuthState = z.infer<typeof storedSchema>

function safeParseCursor(cursor: BankCursor | null): StoredNordeaRestAuthState {
  if (!cursor?.value) return {}
  try {
    return storedSchema.parse(JSON.parse(cursor.value))
  } catch {
    return {}
  }
}

function toCursor(state: StoredNordeaRestAuthState): BankCursor {
  const ordered: StoredNordeaRestAuthState = {
    status: state.status ?? null,
    accessId: state.accessId ?? null,
    clientToken: state.clientToken ?? null,
    authorizationCode: state.authorizationCode ?? null,
    accessToken: state.accessToken ?? null,
    refreshToken: state.refreshToken ?? null,
    accessTokenExpiresAt: state.accessTokenExpiresAt ?? null,
    updatedAt: state.updatedAt ?? null,
  }
  return { value: JSON.stringify(ordered) }
}

function isTokenStillValid(expiresAtIso: string | null | undefined): boolean {
  if (!expiresAtIso) return false
  const expiresAt = new Date(expiresAtIso)
  if (Number.isNaN(expiresAt.getTime())) return false
  return expiresAt.getTime() - Date.now() > 60_000
}

export async function getNordeaRestAccessToken(db: any, input: {
  client: NordeaCorporateRestClient
  provider: 'nordea'
  agreementNumber: string
  authorizerId: string
  durationSeconds: number
  scopes: string[]
}): Promise<string> {
  const log = logger.child({ scope: 'banking.nordeaRestAuth' })

  const currentCursor = await getAgreementCursor(db, {
    provider: input.provider,
    adapterKey: NORDEA_REST_AUTH_CURSOR_KEY,
  })
  const state = safeParseCursor(currentCursor)

  // Manual override requested via API.
  if (state.status === 'RESTART_REQUESTED') {
    // fallthrough to full auth
  } else if (state.accessToken && isTokenStillValid(state.accessTokenExpiresAt)) {
    return state.accessToken
  }

  if (state.refreshToken) {
    try {
      const refreshed = await input.client.refreshAccessToken({ refreshToken: state.refreshToken })
      const raw = refreshed.raw as any
      const expiresIn = typeof raw?.response?.expires_in === 'number' ? raw.response.expires_in : null
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null

      const next: StoredNordeaRestAuthState = {
        ...state,
        status: 'COMPLETED',
        accessToken: refreshed.tokens.accessToken,
        refreshToken: refreshed.tokens.refreshToken,
        accessTokenExpiresAt: expiresAt,
        updatedAt: new Date().toISOString(),
      }

      await setAgreementCursor(db, {
        provider: input.provider,
        adapterKey: NORDEA_REST_AUTH_CURSOR_KEY,
        cursor: toCursor(next),
      })

      return refreshed.tokens.accessToken
    } catch (err) {
      log.warn('Nordea REST refresh failed, falling back to full authorization', {
        message: String((err as any)?.message ?? err),
      })
    }
  }

  const initiated = await input.client.initiateAuthorization({
    agreementNumber: input.agreementNumber,
    durationSeconds: input.durationSeconds,
    scopes: input.scopes,
  })

  const accessId = initiated.accessId
  const clientToken = initiated.clientToken
  if (!accessId || !clientToken) {
    throw new Error('Nordea REST authorization initiation did not return access_id/client_token')
  }

  let status = initiated.status

  let nextState: StoredNordeaRestAuthState = {
    ...state,
    status,
    accessId,
    clientToken,
    authorizationCode: null,
    accessToken: null,
    refreshToken: null,
    accessTokenExpiresAt: null,
    updatedAt: new Date().toISOString(),
  }

  await setAgreementCursor(db, {
    provider: input.provider,
    adapterKey: NORDEA_REST_AUTH_CURSOR_KEY,
    cursor: toCursor(nextState),
  })

  if (status === 'CREATED') {
    const confirmed = await input.client.confirmAuthorization({
      accessId,
      authorizerId: input.authorizerId,
      bearerToken: clientToken,
    })

    status = confirmed.status
    nextState = { ...nextState, status: status ?? nextState.status, updatedAt: new Date().toISOString() }
    await setAgreementCursor(db, {
      provider: input.provider,
      adapterKey: NORDEA_REST_AUTH_CURSOR_KEY,
      cursor: toCursor(nextState),
    })
  }

  const maxAttempts = 20
  const delayMs = 2_000

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const polled = await input.client.getAuthorizationStatus({ accessId, bearerToken: clientToken })
    status = polled.status
    const authorizationCode = polled.code ?? null

    nextState = {
      ...nextState,
      status: status ?? nextState.status,
      authorizationCode,
      updatedAt: new Date().toISOString(),
    }

    await setAgreementCursor(db, {
      provider: input.provider,
      adapterKey: NORDEA_REST_AUTH_CURSOR_KEY,
      cursor: toCursor(nextState),
    })

    if (status === 'ACTIVE') break
    if (status === 'EXPIRED') throw new Error('Nordea REST authorization expired before becoming ACTIVE')

    await new Promise((r) => setTimeout(r, delayMs))
  }

  if (status !== 'ACTIVE') {
    throw new Error(`Nordea REST authorization did not become ACTIVE (status=${status ?? 'null'})`)
  }

  const codeToExchange = nextState.authorizationCode ?? clientToken

  const exchanged = await input.client.exchangeAuthorizationCodeForTokens({ code: codeToExchange })
  const raw = exchanged.raw as any
  const expiresIn = typeof raw?.response?.expires_in === 'number' ? raw.response.expires_in : null
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null

  nextState = {
    ...nextState,
    status: 'COMPLETED',
    accessToken: exchanged.tokens.accessToken,
    refreshToken: exchanged.tokens.refreshToken,
    accessTokenExpiresAt: expiresAt,
    updatedAt: new Date().toISOString(),
  }

  await setAgreementCursor(db, {
    provider: input.provider,
    adapterKey: NORDEA_REST_AUTH_CURSOR_KEY,
    cursor: toCursor(nextState),
  })

  return exchanged.tokens.accessToken
}
