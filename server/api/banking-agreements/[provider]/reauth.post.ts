import { defineEventHandler, createError } from 'h3'

import db from '~/lib/db'
import { bankProviderValues } from '~/lib/db/schema/bankingAgreement'

import { setAgreementCursor } from '~/../engine/banking-ingestion/handlers/bankingAgreementCursorStore'
import { validateProviderEnvOrThrow } from '~/../engine/banking-ingestion/infrastructure/providerEnv'
import { loadNordeaRestEnv } from '~/../engine/banking-ingestion/infrastructure/nordea/rest/env'
import { NordeaCorporateRestClient } from '~/../engine/banking-ingestion/infrastructure/nordea/rest/client'
import { NORDEA_REST_AUTH_CURSOR_KEY } from '~/../engine/banking-ingestion/infrastructure/nordea/rest/constants'

export default defineEventHandler(async (event) => {
  const provider = event.context.params?.provider
  if (!provider || !bankProviderValues.includes(provider as any)) {
    throw createError({ statusCode: 400, statusMessage: 'Ugyldig provider' })
  }

  if (provider !== 'nordea') {
    throw createError({ statusCode: 400, statusMessage: 'Reauth er kun implementeret for Nordea (REST) lige nu' })
  }

  // Validate env up front so we can give a clear error.
  try {
    validateProviderEnvOrThrow('nordea', 'rest')
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: String(err?.message ?? err) })
  }

  const env = loadNordeaRestEnv()

  const client = new NordeaCorporateRestClient({
    host: env.NORDEA_REST_HOST,
    clientId: env.NORDEA_REST_CLIENT_ID,
    clientSecret: env.NORDEA_REST_CLIENT_SECRET,
    eidasPrivateKeyPem: env.eidasPrivateKeyPem,
    timeoutMs: env.NORDEA_REST_TIMEOUT_MS,
  })

  const initiated = await client.initiateAuthorization({
    agreementNumber: env.NORDEA_REST_AGREEMENT_NUMBER,
    durationSeconds: env.NORDEA_REST_ACCESS_DURATION_SEC,
    scopes: env.scopes,
  })

  const accessId = initiated.accessId
  const clientToken = initiated.clientToken
  if (!accessId || !clientToken) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Nordea REST authorize gav ikke access_id/client_token',
    })
  }

  let status = initiated.status

  // Confirm right away (same step as the ingestion auth flow).
  if (status === 'CREATED') {
    const confirmed = await client.confirmAuthorization({
      accessId,
      authorizerId: env.NORDEA_REST_AUTHORIZER_ID,
      bearerToken: clientToken,
    })
    status = confirmed.status
  }

  const updatedAt = new Date().toISOString()

  await setAgreementCursor(db as any, {
    provider: 'nordea' as any,
    adapterKey: NORDEA_REST_AUTH_CURSOR_KEY,
    cursor: {
      value: JSON.stringify({
        status: status ?? null,
        accessId,
        clientToken,
        authorizationCode: null,
        accessToken: null,
        refreshToken: null,
        accessTokenExpiresAt: null,
        updatedAt,
      }),
    },
  })

  return {
    provider: 'nordea',
    channel: 'rest',
    status: status ?? null,
    accessId,
    updatedAt,
    accessTokenExpiresAt: null,
    hasAccessToken: false,
    hasRefreshToken: false,
    message: 'Godkend 2FA/autorisation i Nordea (netbank/app), og tryk derefter "Opdater status".',
  }
})
