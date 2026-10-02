import { createError, getRequestHeader, type H3Event } from 'h3'
import type { AppRole } from '~/lib/authz/policy'
import { extractRolesFromOidcUser } from '~/lib/authz/extractRoles'

type OidcSession = {
  userName?: string
  userInfo?: Record<string, unknown>
  claims?: Record<string, unknown>
  accessToken?: string
}

export type LockOwnerIdentity = {
  id: string
  displayName: string
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

async function requireRoleSession(event: H3Event, requiredRoles: readonly AppRole[]): Promise<OidcSession | null> {
  if (!requiredRoles.length) return null
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

  return session
}

export async function requireAnyAppRole(event: H3Event, requiredRoles: readonly AppRole[]): Promise<void> {
  await requireRoleSession(event, requiredRoles)
}

export async function requireWriteAccess(event: H3Event): Promise<void> {
  return requireAnyAppRole(event, WRITE_ROLES)
}

export function resolveLockOwnerIdentity(
  session: OidcSession,
  developmentIdentityAllowed: boolean,
): LockOwnerIdentity {
  const subject = session?.userInfo?.sub ?? session?.claims?.sub
  const preferredUsername = session?.userInfo?.preferred_username ?? session?.claims?.preferred_username
  const developmentUsername = [preferredUsername, session?.userName]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
    ?.trim()

  if ((typeof subject !== 'string' || !subject.trim()) && !developmentIdentityAllowed) {
    throw createError({ statusCode: 401, statusMessage: 'Brugerens OIDC-identitet mangler' })
  }

  const issuer = session?.userInfo?.iss ?? session?.claims?.iss
  const stableIssuer = typeof issuer === 'string' && issuer.trim()
    ? issuer.trim()
    : developmentIdentityAllowed ? 'development' : 'oidc'
  const userInfoName = session?.userInfo?.name
  const displayName = [userInfoName, preferredUsername, session?.userName]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
    ?.trim() ?? 'anden bruger'
  const ownerSubject = typeof subject === 'string' && subject.trim()
    ? subject.trim()
    : `dev:${developmentUsername || displayName}`

  return {
    id: `${stableIssuer}:${ownerSubject}`,
    displayName,
  }
}

export async function requireWriteAccessWithIdentity(event: H3Event): Promise<LockOwnerIdentity> {
  const session = await requireRoleSession(event, WRITE_ROLES)
  const config = useRuntimeConfig(event)
  const developmentIdentityAllowed = process.env.NODE_ENV !== 'production'
    && (config.public?.oidcDevMode === true || config.public?.devAuthBypass === true)

  return resolveLockOwnerIdentity(session ?? {}, developmentIdentityAllowed)
}

export async function requireErrorHandlingReadAccess(event: H3Event): Promise<void> {
  return requireAnyAppRole(event, ERROR_HANDLING_READ_ROLES)
}

export async function requireErrorHandlingWriteAccess(event: H3Event): Promise<void> {
  return requireAnyAppRole(event, ERROR_HANDLING_WRITE_ROLES)
}