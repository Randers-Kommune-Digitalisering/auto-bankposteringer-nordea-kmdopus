import { createError, getRequestHeader, getRequestURL, type H3Event } from 'h3'
import type { AppRole } from '~/lib/authz/policy'

type OidcSession = {
  userName?: string
  userInfo?: Record<string, unknown>
  claims?: Record<string, unknown>
}

const WRITE_ROLES: readonly AppRole[] = ['bookkeeper', 'admin', 'rule_admin', 'dev']

function toRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
}

function toStringArray(input: unknown): string[] {
  return Array.isArray(input) ? input.filter((value): value is string => typeof value === 'string') : []
}

function extractSessionRoles(session: OidcSession): string[] {
  const claims = toRecord(session.claims)
  const userInfo = toRecord(session.userInfo)

  // Keep extraction deterministic and explicit: claims.roles is primary, userInfo.roles as fallback.
  const roles = [
    ...toStringArray(claims.roles),
    ...toStringArray(userInfo.roles),
  ]

  return Array.from(new Set(roles.map((role) => role.trim()).filter(Boolean)))
}

async function getOidcSession(event: H3Event): Promise<OidcSession> {
  const url = new URL('/api/_auth/session', getRequestURL(event))
  const cookie = getRequestHeader(event, 'cookie')

  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      ...(cookie ? { cookie } : {}),
    },
  })

  if (response.status === 401) {
    throw createError({ statusCode: 401, statusMessage: 'Ikke logget ind' })
  }

  if (!response.ok) {
    throw createError({ statusCode: 401, statusMessage: 'Kunne ikke hente bruger-session' })
  }

  const payload = (await response.json()) as OidcSession | Record<string, unknown>
  if (!payload || typeof payload !== 'object') {
    throw createError({ statusCode: 401, statusMessage: 'Bruger-session er ugyldig' })
  }

  return payload as OidcSession
}

export async function requireAnyAppRole(event: H3Event, requiredRoles: readonly AppRole[]): Promise<void> {
  if (!requiredRoles.length) return

  const session = await getOidcSession(event)
  const userRoles = extractSessionRoles(session)

  const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role))
  if (!hasRequiredRole) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
}

export async function requireWriteAccess(event: H3Event): Promise<void> {
  return requireAnyAppRole(event, WRITE_ROLES)
}