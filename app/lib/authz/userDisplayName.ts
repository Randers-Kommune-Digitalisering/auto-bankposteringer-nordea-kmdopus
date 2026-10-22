type OidcUser = {
  userInfo?: Record<string, unknown>
  userName?: string
}

function getClaim(userInfo: Record<string, unknown> | undefined, claim: string): string | undefined {
  const value = userInfo?.[claim]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function resolveUserDisplayName(user: OidcUser | null | undefined): string {
  const userInfo = user?.userInfo
  const name = getClaim(userInfo, 'name')
  if (name) return name

  const givenName = getClaim(userInfo, 'given_name') ?? getClaim(userInfo, 'firstName')
  const familyName = getClaim(userInfo, 'family_name') ?? getClaim(userInfo, 'lastName')
  const fullName = [givenName, familyName].filter(Boolean).join(' ')
  if (fullName) return fullName

  return user?.userName?.trim() || 'Bruger'
}
