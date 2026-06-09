import type { AppRole } from '~/lib/authz/roles'
import { hasAnyRole } from '~/lib/authz/roles'

export type RouteRolePolicy = {
  prefix: string
  roles: AppRole[]
}

// Keep one canonical route -> role map for UI visibility and route guards.
export const routeRolePolicies: RouteRolePolicy[] = [
  { prefix: '/indstillinger', roles: ['sys_admin', 'rule_admin', 'dev'] },
  { prefix: '/fejlhaandtering', roles: ['sys_admin'] },
  { prefix: '/konteringsregler', roles: ['rule_admin'] },
  { prefix: '/aabne-poster', roles: ['bookkeeping', 'dev'] },
  { prefix: '/kontoudtog', roles: ['bookkeeping', 'sys_admin', 'rule_admin', 'dev'] },
  { prefix: '/koersler', roles: ['sys_admin', 'bookkeeping'] },
  { prefix: '/', roles: ['bookkeeping', 'sys_admin', 'rule_admin', 'dev'] },
]

export function requiredRolesForPath(path: string): AppRole[] | undefined {
  const match = routeRolePolicies.find((policy) => path === policy.prefix || path.startsWith(`${policy.prefix}/`))
  return match?.roles
}

export function canAccessPath(path: string, roles: readonly AppRole[]): boolean {
  const required = requiredRolesForPath(path)
  if (!required) return true
  return hasAnyRole(roles, required)
}
