import { defineEventHandler, createError, getQuery } from 'h3'
import { z } from 'zod'

import db from '~/lib/db'
import { bankProviderValues } from '~/lib/db/schema/bankingAgreement'

import { getAgreementCursor, setAgreementCursor } from '~/../engine/banking-ingestion/handlers/bankingAgreementCursorStore'
import { loadNordeaRestEnv } from '~/../engine/banking-ingestion/infrastructure/nordea/rest/env'
import { NordeaCorporateRestClient } from '~/../engine/banking-ingestion/infrastructure/nordea/rest/client'
import { NORDEA_REST_AUTH_CURSOR_KEY } from '~/../engine/banking-ingestion/infrastructure/nordea/rest/constants'

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

function safeParseCursor(value: string | null | undefined): StoredNordeaRestAuthState {
  if (!value) return {}
  try {
    return storedSchema.parse(JSON.parse(value))
  } catch {
    return {}
  }
}

function computeExpiresAt(raw: unknown): string | null {
  const expiresIn = typeof (raw as any)?.response?.expires_in === 'number' ? (raw as any).response.expires_in : null
  if (!expiresIn) return null
  return new Date(Date.now() + expiresIn * 1000).toISOString()
}

export default defineEventHandler(async (event) => {
  const provider = event.context.params?.provider
  if (!provider || !bankProviderValues.includes(provider as any)) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldig provider' })
  }

  if (provider !== 'nordea') {
    throw createError({ statusCode: 400, statusMessage: 'Authstatus er kun implementeret for Nordea (REST) lige nu' })
  }

  const query = getQuery(event)
  const refresh = query.refresh === '1' || query.refresh === 'true'

  const current = await getAgreementCursor(db as any, {
    provider: 'nordea' as any,
    adapterKey: NORDEA_REST_AUTH_CURSOR_KEY,
  })

  let state = safeParseCursor(current?.value)

  if (refresh && state.accessId && state.clientToken) {
    const env = loadNordeaRestEnv()
    const client = new NordeaCorporateRestClient({
      host: env.NORDEA_REST_HOST,
      clientId: env.NORDEA_REST_CLIENT_ID,
      clientSecret: env.NORDEA_REST_CLIENT_SECRET,
      eidasPrivateKeyPem: env.eidasPrivateKeyPem,
      timeoutMs: env.NORDEA_REST_TIMEOUT_MS,
    })

    const polled = await client.getAuthorizationStatus({ accessId: state.accessId, bearerToken: state.clientToken })

    state = {
      ...state,
      status: polled.status ?? state.status ?? null,
      authorizationCode: polled.code ?? state.authorizationCode ?? null,
      updatedAt: new Date().toISOString(),
    }

    // If it's ACTIVE, exchange code -> tokens and store them.
    if (state.status === 'ACTIVE' && !state.accessToken) {
      const codeToExchange = state.authorizationCode ?? state.clientToken
      const exchanged = await client.exchangeAuthorizationCodeForTokens({ code: codeToExchange })

      state = {
        ...state,
        status: 'COMPLETED',
        accessToken: exchanged.tokens.accessToken,
        refreshToken: exchanged.tokens.refreshToken,
        accessTokenExpiresAt: computeExpiresAt(exchanged.raw),
        updatedAt: new Date().toISOString(),
      }
    }

    await setAgreementCursor(db as any, {
      provider: 'nordea' as any,
      adapterKey: NORDEA_REST_AUTH_CURSOR_KEY,
      cursor: { value: JSON.stringify(state) },
    })
  }

  return {
    provider: 'nordea',
    channel: 'rest',
    status: state.status ?? null,
    accessId: state.accessId ?? null,
    updatedAt: state.updatedAt ?? null,
    accessTokenExpiresAt: state.accessTokenExpiresAt ?? null,
    hasAccessToken: Boolean(state.accessToken),
    hasRefreshToken: Boolean(state.refreshToken),
    message:
      state.status === 'ACTIVE'
        ? 'Autorisation er ACTIVE. Der kan nu hentes token (brug "Opdater status" én gang til hvis den ikke allerede står COMPLETED).'
        : state.status === 'COMPLETED'
          ? 'Autorisation er COMPLETED.'
          : 'Godkend autorisation i Nordea og brug "Opdater status".',
  }
})
