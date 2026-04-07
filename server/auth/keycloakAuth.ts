import { getRequestHeader, H3Event, createError } from 'h3'
import env from '~/lib/env/env'

export type KeycloakTokenPayload = {
  preferred_username?: string
}

export type AuthContext = {
  token: string
  payload: KeycloakTokenPayload
  username?: string
  roles: string[]
}

type ProxyAuthHeaders = {
  user?: string
  email?: string
  groups?: string
}

export type ProxyAuthContext = {
  username: string
  roles: string[]
}

function getProxyAuthHeaders(event: H3Event): ProxyAuthHeaders {
  return {
    user: getRequestHeader(event, 'x-auth-request-user') ?? undefined,
    email: getRequestHeader(event, 'x-auth-request-email') ?? undefined,
    groups: getRequestHeader(event, 'x-auth-request-groups') ?? undefined,
  }
}

function parseGroupsHeader(groups: string | undefined): string[] {
  if (!groups) return []
  // oauth2-proxy commonly separates groups by comma
  return groups
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

function mapGroupsToRoles(groups: string[], allowedGroupPrefix: string | undefined): string[] {
  // Convention: allowed group prefix + role slug as child group.
  // Example prefix: /auto-bankposteringer-nordea-kmdopus-adgang
  // Roles: /...-adgang/sys_admin, /...-adgang/bookkeeping, ...
  if (!allowedGroupPrefix) return []
  const normalizedPrefix = allowedGroupPrefix.replace(/\/+$/, '')

  const allowed = new Set(['requesting', 'bookkeeping', 'sys_admin', 'rule_admin'])
  const out = new Set<string>()

  for (const g of groups) {
    const ng = g.trim()
    if (!ng.startsWith(normalizedPrefix)) continue
    const rest = ng.slice(normalizedPrefix.length)
    const parts = rest.split('/').filter(Boolean)
    for (const p of parts) {
      if (allowed.has(p)) out.add(p)
    }
  }

  return Array.from(out)
}

export function authFromProxyHeaders(input: ProxyAuthHeaders, allowedGroupPrefix: string | undefined): ProxyAuthContext | null {
  if (!input.user) return null
  const groups = parseGroupsHeader(input.groups)
  const roles = mapGroupsToRoles(groups, allowedGroupPrefix)
  return { username: input.user, roles }
}

export function extractRolesFromToken(): string[] {
  return []
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

  // Preferred in A-architecture: oauth2-proxy injects xauthrequest headers.
  const proxyHeaders = getProxyAuthHeaders(event)
  const proxyCtx = authFromProxyHeaders(proxyHeaders, env.OIDC_ALLOWED_GROUP_PREFIX)
  if (proxyCtx) {
    return {
      token: 'proxy-xauthrequest',
      payload: {
        preferred_username: proxyCtx.username,
      },
      username: proxyCtx.username,
      roles: proxyCtx.roles,
    }
  }

  throw createError({ statusCode: 401, statusMessage: 'Missing proxy auth headers (X-Auth-Request-User)' })
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
