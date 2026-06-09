export const APP_ROLES = ['requesting', 'bookkeeping', 'sys_admin', 'rule_admin', 'dev'] as const

export type AppRole = (typeof APP_ROLES)[number]

const APP_ROLE_SET = new Set<AppRole>(APP_ROLES)

type AnyRecord = Record<string, unknown>

function toRecord(input: unknown): AnyRecord {
  return input && typeof input === 'object' ? (input as AnyRecord) : {}
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

function addKnownRoles(target: Set<AppRole>, values: unknown): void {
  for (const role of asStringArray(values)) {
    if (APP_ROLE_SET.has(role as AppRole)) {
      target.add(role as AppRole)
    }
  }
}

function mapRolesFromPrefixedGroups(groups: unknown, allowedGroupPrefix: string | undefined): AppRole[] {
  if (!allowedGroupPrefix) return []

  const normalizedPrefix = allowedGroupPrefix.replace(/\/+$/, '')
  const out = new Set<AppRole>()

  for (const group of asStringArray(groups)) {
    const normalizedGroup = group.trim()
    if (!normalizedGroup.startsWith(normalizedPrefix)) continue

    const rest = normalizedGroup.slice(normalizedPrefix.length)
    const parts = rest.split('/').filter(Boolean)
    for (const part of parts) {
      if (APP_ROLE_SET.has(part as AppRole)) {
        out.add(part as AppRole)
      }
    }
  }

  return Array.from(out)
}

export type ResolveRolesOptions = {
  clientId?: string | null
  allowedGroupPrefix?: string
}

export function resolveAppRolesFromSession(input: unknown, options: ResolveRolesOptions = {}): AppRole[] {
  const record = toRecord(input)
  const claims = toRecord(record.claims)
  const userInfo = toRecord(record.userInfo)

  const out = new Set<AppRole>()

  addKnownRoles(out, toRecord(claims.realm_access).roles)
  addKnownRoles(out, claims.roles)
  addKnownRoles(out, userInfo.roles)

  const clientId = options.clientId ?? undefined
  if (clientId) {
    const resourceAccess = toRecord(claims.resource_access)
    const clientAccess = toRecord(resourceAccess[clientId])
    addKnownRoles(out, clientAccess.roles)
  }

  for (const role of mapRolesFromPrefixedGroups(claims.groups, options.allowedGroupPrefix)) out.add(role)
  for (const role of mapRolesFromPrefixedGroups(userInfo.groups, options.allowedGroupPrefix)) out.add(role)

  return Array.from(out)
}

export function hasAnyRole(userRoles: readonly AppRole[], requiredRoles: readonly AppRole[]): boolean {
  if (!requiredRoles.length) return true
  return requiredRoles.some((role) => userRoles.includes(role))
}
