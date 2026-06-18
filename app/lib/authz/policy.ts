const APP_ROLES = ['bookkeeper', 'admin', 'rule_admin', 'dev'] as const
export type AppRole = (typeof APP_ROLES)[number]

export const ROUTE_ROLE_POLICIES = {
  '/': ['bookkeeper', 'admin', 'rule_admin', 'dev'],
  '/indstillinger': ['admin', 'rule_admin', 'dev'],
  '/fejlhaandtering': ['admin', 'dev'],
  '/konteringsregler': ['rule_admin', 'dev'],
  '/aabne-poster': ['bookkeeper', 'dev'],
  '/kontoudtog': ['bookkeeper', 'admin', 'rule_admin', 'dev'],
  '/koersler': ['admin', 'bookkeeper', 'dev'],
} as const satisfies Record<string, readonly AppRole[]>

export function requiredRolesForPath(path: string): readonly AppRole[] | undefined {
  const match = Object.entries(ROUTE_ROLE_POLICIES)
    .sort(([a], [b]) => b.length - a.length)
    .find(([prefix]) =>
      path === prefix || path.startsWith(`${prefix}/`)
    )

  return match?.[1]
}

export function hasAnyRole(
  userRoles: readonly string[],
  requiredRoles: readonly AppRole[],
): boolean {
  return requiredRoles.some(role => userRoles.includes(role))
}

export function canAccessPath(
  path: string,
  userRoles: readonly string[],
): boolean {
  const requiredRoles = requiredRolesForPath(path)

  if (!path) return true

  if (!requiredRoles?.length) {
    return true
  }

  return requiredRoles.some(role =>
    userRoles.includes(role),
  )
}