import { createError, getRequestHeader, getRequestURL, H3Event } from 'h3'
import env from '~/lib/env/env'
import { resolveAppRolesFromSession, type AppRole } from '~/lib/authz/roles'

export type KeycloakTokenPayload = {
  preferred_username?: string
  [key: string]: unknown
}

export type AuthContext = {
  token: string
  payload: KeycloakTokenPayload
  username?: string
  roles: string[]
}

type OidcSession = {
  userName?: string
  userInfo?: Record<string, unknown>
  claims?: Record<string, unknown>
}

function toRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
}

function resolvePreferredUsername(session: OidcSession): string | undefined {
  const userInfo = toRecord(session.userInfo)
  const preferredUsername = userInfo.preferred_username
  if (typeof preferredUsername === 'string' && preferredUsername.trim().length > 0) {
    return preferredUsername
  }

  const email = userInfo.email
  if (typeof email === 'string' && email.trim().length > 0) {
    return email
  }

  if (typeof session.userName === 'string' && session.userName.trim().length > 0) {
    return session.userName
  }

  return undefined
}

async function getOidcSessionFromApi(event: H3Event): Promise<OidcSession> {
  const url = new URL('/api/_auth/session', getRequestURL(event))
  const cookie = getRequestHeader(event, 'cookie')

  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      ...(cookie ? { cookie } : {}),
    },
  })

  if (!response.ok) {
    throw createError({ statusCode: 401, statusMessage: 'Kunne ikke hente OIDC session' })
  }

  const payload = (await response.json()) as OidcSession | Record<string, unknown>
  if (!payload || typeof payload !== 'object') {
    throw createError({ statusCode: 401, statusMessage: 'OIDC session mangler eller er ugyldig' })
  }

  return payload as OidcSession
}

export function extractRolesFromToken(session: OidcSession): AppRole[] {
  return resolveAppRolesFromSession(session, {
    clientId: env.KEYCLOAK_CLIENT_ID,
    allowedGroupPrefix: env.OIDC_ALLOWED_GROUP_PREFIX,
  })
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

  const session = await getOidcSessionFromApi(event)
  const roles = extractRolesFromToken(session)
  const username = resolvePreferredUsername(session)

  if (!roles.length) {
    throw createError({ statusCode: 403, statusMessage: 'Ingen gyldige applikationsroller fundet i session' })
  }

  return {
    token: 'oidc-session',
    payload: {
      preferred_username: username,
      ...toRecord(session.claims),
    },
    username,
    roles,
  }
}

export async function requireRoles(event: H3Event, requiredRoles: string[]): Promise<AuthContext> {
  const ctx = await requireAuth(event)
  if (!requiredRoles.length) return ctx

  // Backwards-compatible role aliases.
  // Many endpoints historically used 'write' as a capability, while the app
  // actually models roles like 'bookkeeping' / 'rule_admin' / 'sys_admin'.
  const roleAliases: Record<string, string[]> = {
    write: ['bookkeeping', 'rule_admin', 'sys_admin'],
  }

  const expandedRequired = new Set<string>()
  for (const r of requiredRoles) {
    expandedRequired.add(r)
    for (const alias of (roleAliases[r] ?? [])) expandedRequired.add(alias)
  }

  const hasAny = Array.from(expandedRequired).some(r => ctx.roles.includes(r))
  if (!hasAny) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return ctx
}
