import { getRequestHeader, getCookie, H3Event, createError } from 'h3'
import env from '~/lib/env/env'
import { decodeJwtPayload, JwksClient, verifyRs256JwtSignature } from './jwks'

export type KeycloakTokenPayload = {
  exp?: number
  iat?: number
  iss?: string
  aud?: string | string[]
  preferred_username?: string
  resource_access?: Record<string, { roles?: string[] }>
  realm_access?: { roles?: string[] }
}

export type AuthContext = {
  token: string
  payload: KeycloakTokenPayload
  username?: string
  roles: string[]
}

type AuthConfig = {
  authUrl: string
  realm: string
  clientId: string
  audience?: string
  accessTokenCookie?: string
}

function getAuthConfig(): AuthConfig | null {
  const authUrl = env.KEYCLOAK_AUTH_URL
  const realm = env.KEYCLOAK_REALM
  const clientId = env.KEYCLOAK_CLIENT_ID
  if (!authUrl || !clientId) return null

  return {
    authUrl: authUrl.replace(/(\r\n|\n|\r)/gm, ''),
    realm,
    clientId,
    audience: env.KEYCLOAK_AUDIENCE ?? clientId,
    accessTokenCookie: env.KEYCLOAK_ACCESS_TOKEN_COOKIE,
  }
}

function buildJwksUrl(cfg: AuthConfig): string {
  const base = cfg.authUrl.replace(/\/$/, '')
  return `${base}/realms/${encodeURIComponent(cfg.realm)}/protocol/openid-connect/certs`
}

let jwksClientSingleton: JwksClient | null = null
let jwksClientUrl: string | null = null
function getJwksClient(cfg: AuthConfig): JwksClient {
  const url = buildJwksUrl(cfg)
  if (!jwksClientSingleton || jwksClientUrl !== url) {
    jwksClientSingleton = new JwksClient(url)
    jwksClientUrl = url
  }
  return jwksClientSingleton
}

function extractBearerToken(event: H3Event): string | null {
  const authHeader = getRequestHeader(event, 'authorization')
  if (authHeader) {
    const m = /^Bearer\s+(.+)$/i.exec(authHeader)
    if (m?.[1]) return m[1].trim()
  }

  const cookieName = env.KEYCLOAK_ACCESS_TOKEN_COOKIE
  if (cookieName) {
    const value = getCookie(event, cookieName)
    if (value) return value
  }

  // Common fallbacks (if upstream uses these)
  const fallbackCookies = ['access_token', 'kc-access', 'Authorization']
  for (const name of fallbackCookies) {
    const v = getCookie(event, name)
    if (v) return v
  }

  return null
}

function normalizeAud(aud: KeycloakTokenPayload['aud']): string[] {
  if (!aud) return []
  if (Array.isArray(aud)) return aud
  return [aud]
}

export function extractRolesFromToken(payload: KeycloakTokenPayload, clientId: string): string[] {
  const resourceRoles = payload.resource_access?.[clientId]?.roles ?? []
  return Array.isArray(resourceRoles) ? resourceRoles : []
}

export async function requireAuth(event: H3Event): Promise<AuthContext> {
  if (env.DEV_AUTH_BYPASS) {
    return {
      token: 'dev-bypass',
      payload: {},
      username: 'dev',
      roles: ['requesting', 'bookkeeping', 'sys_admin', 'rule_admin'],
    }
  }

  const cfg = getAuthConfig()
  if (!cfg) {
    throw createError({ statusCode: 500, statusMessage: 'Auth not configured (missing KEYCLOAK_AUTH_URL/KEYCLOAK_CLIENT_ID)' })
  }

  const token = extractBearerToken(event)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Missing access token' })
  }

  const payload = decodeJwtPayload<KeycloakTokenPayload>(token)

  const nowSeconds = Math.floor(Date.now() / 1000)
  if (payload.exp && payload.exp <= nowSeconds) {
    throw createError({ statusCode: 401, statusMessage: 'Token expired' })
  }

  const aud = normalizeAud(payload.aud)
  if (cfg.audience && aud.length && !aud.includes(cfg.audience)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid audience' })
  }

  const publicKey = await getJwksClient(cfg).getKeyForToken(token)
  const ok = verifyRs256JwtSignature(token, publicKey)
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token signature' })
  }

  const roles = extractRolesFromToken(payload, cfg.clientId)

  return {
    token,
    payload,
    username: payload.preferred_username,
    roles,
  }
}

export async function requireRoles(event: H3Event, requiredRoles: string[]): Promise<AuthContext> {
  const ctx = await requireAuth(event)
  if (!requiredRoles.length) return ctx
  const hasAny = requiredRoles.some(r => ctx.roles.includes(r))
  if (!hasAny) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return ctx
}
