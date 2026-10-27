export type AccessLogUserIdentity = {
  userName?: string
  userLookup?: 'anonymous' | 'unresolved' | 'failed'
}

export type OidcAccessSession = {
  userName?: unknown
  userInfo?: Record<string, unknown>
  claims?: Record<string, unknown>
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)
    ?.trim()
    .slice(0, 128)
}

export function resolveAccessLogUserIdentity(session: OidcAccessSession): AccessLogUserIdentity {
  const userName = firstString(
    session.userInfo?.preferred_username,
    session.claims?.preferred_username,
    session.userName,
  )

  return userName ? { userName } : { userLookup: 'unresolved' }
}
