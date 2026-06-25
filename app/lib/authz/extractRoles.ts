type UnknownRecord = Record<string, unknown>

type OidcLikeUser = {
  claims?: unknown
  userInfo?: unknown
  accessToken?: unknown
}

function toRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {}
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map(item => item.trim())
      .filter(Boolean)
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return [value.trim()]
  }

  return []
}

function base64UrlDecode(input: string): string | null {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')

  try {
    if (typeof globalThis.atob === 'function') {
      return globalThis.atob(padded)
    }

    if (typeof Buffer !== 'undefined') {
      return Buffer.from(padded, 'base64').toString('utf8')
    }
  }
  catch {
    return null
  }

  return null
}

function parseJwtPayload(token: unknown): UnknownRecord {
  if (typeof token !== 'string' || token.length === 0) {
    return {}
  }

  const parts = token.split('.')
  if (parts.length < 2 || !parts[1]) {
    return {}
  }

  const decoded = base64UrlDecode(parts[1])
  if (!decoded) {
    return {}
  }

  try {
    return toRecord(JSON.parse(decoded))
  }
  catch {
    return {}
  }
}

function extractRealmRoles(input: unknown): string[] {
  const realmAccess = toRecord(input)
  return toStringArray(realmAccess.roles)
}

function extractClientRoles(input: unknown, clientId?: string): string[] {
  const resourceAccess = toRecord(input)

  const roleGroups = clientId
    ? [resourceAccess[clientId]]
    : Object.values(resourceAccess)

  return roleGroups.flatMap((group) => {
    const roleEntry = toRecord(group)
    return toStringArray(roleEntry.roles)
  })
}

export function extractRolesFromOidcUser(
  user: OidcLikeUser,
  options?: { clientId?: string, includeDevRole?: boolean },
): string[] {
  const includeDevRole = options?.includeDevRole === true

  const claims = toRecord(user.claims)
  const userInfo = toRecord(user.userInfo)
  const accessTokenPayload = parseJwtPayload(user.accessToken)

  const roles = [
    ...(includeDevRole ? ['dev'] : []),
    ...toStringArray(claims.roles),
    ...toStringArray(userInfo.roles),
    ...toStringArray(accessTokenPayload.roles),
    ...extractRealmRoles(claims.realm_access),
    ...extractRealmRoles(userInfo.realm_access),
    ...extractRealmRoles(accessTokenPayload.realm_access),
    ...extractClientRoles(claims.resource_access, options?.clientId),
    ...extractClientRoles(userInfo.resource_access, options?.clientId),
    ...extractClientRoles(accessTokenPayload.resource_access, options?.clientId),
  ]

  return Array.from(new Set(roles))
}
