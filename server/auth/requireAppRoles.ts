import { createError, getRequestHeader, type H3Event } from 'h3'
import type { AppRole } from '~/lib/authz/policy'
import { extractRolesFromOidcUser } from '~/lib/authz/extractRoles'

type OidcSession = {
  userName?: string
  userInfo?: Record<string, unknown>
  claims?: Record<string, unknown>
  accessToken?: string
}

const WRITE_ROLES: readonly AppRole[] = ['bookkeeper', 'admin', 'rule_admin', 'dev']
const ERROR_HANDLING_READ_ROLES: readonly AppRole[] = ['admin', 'dev']
const ERROR_HANDLING_WRITE_ROLES: readonly AppRole[] = ['admin', 'dev']

function extractSessionRoles(session: OidcSession, clientId?: string, includeDevRole?: boolean): string[] {
  return extractRolesFromOidcUser(session, { clientId, includeDevRole })
}

async function getOidcSession(event: H3Event): Promise<OidcSession> {
  const cookie = getRequestHeader(event, 'cookie')

  try {
    const payload = await event.$fetch<OidcSession | Record<string, unknown>>('/api/_auth/session', {
      headers: {
        accept: 'application/json',
        ...(cookie ? { cookie } : {}),
      },
    })

    if (!payload || typeof payload !== 'object') {
      throw createError({ statusCode: 401, statusMessage: 'Bruger-session er ugyldig' })
    }

    return payload as OidcSession
  }
  catch (error) {
    const status = typeof error === 'object' && error !== null && 'response' in error
      ? ((error as { response?: { status?: number } }).response?.status ?? null)
      : null

    if (status === 401) {
      throw createError({ statusCode: 401, statusMessage: 'Ikke logget ind' })
    }

    throw createError({ statusCode: 401, statusMessage: 'Kunne ikke hente bruger-session' })
  }
}

export async function requireAnyAppRole(event: H3Event, requiredRoles: readonly AppRole[]): Promise<void> {
  if (!requiredRoles.length) return

  const session = await getOidcSession(event)
  const config = useRuntimeConfig(event)
  const oidcClientId = config.public?.oidcClientId
  const userRoles = extractSessionRoles(
    session,
    typeof oidcClientId === 'string' ? oidcClientId : undefined,
    config.public?.devAuthBypass === true,
  )

  const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role))
  if (!hasRequiredRole) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
}

export async function requireWriteAccess(event: H3Event): Promise<void> {
  return requireAnyAppRole(event, WRITE_ROLES)
}

export async function requireErrorHandlingReadAccess(event: H3Event): Promise<void> {
  return requireAnyAppRole(event, ERROR_HANDLING_READ_ROLES)
}

export async function requireErrorHandlingWriteAccess(event: H3Event): Promise<void> {
  return requireAnyAppRole(event, ERROR_HANDLING_WRITE_ROLES)
}