import { createError } from 'h3'
import env from '~/lib/env/env'
import { BearerAuthClient } from '~~/server/auth/oauth2'

export type KeycloakRole = {
  id: string
  name: string
  description?: string
  composite?: boolean
  clientRole?: boolean
  containerId?: string
}

export type KeycloakUser = {
  id: string
  username?: string
  email?: string
  firstName?: string
  lastName?: string
  enabled?: boolean
}

export type KeycloakGroup = {
  id: string
  name?: string
  path?: string
}

type KeycloakClient = {
  id: string
  clientId: string
}

function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim()
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : (/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(\/.*)?$/i.test(trimmed) || /:\d+(\/.*)?$/.test(trimmed))
      ? `http://${trimmed}`
      : `https://${trimmed}`

  return withScheme.replace(/\/+$/, '')
}

function requireAdminEnv() {
  if (!env.KEYCLOAK_AUTH_URL || !env.KEYCLOAK_REALM) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Keycloak admin API mangler KEYCLOAK_AUTH_URL eller KEYCLOAK_REALM',
    })
  }

  if (!env.KEYCLOAK_ADMIN_CLIENT_ID || !env.KEYCLOAK_ADMIN_CLIENT_SECRET) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Keycloak admin API mangler KEYCLOAK_ADMIN_CLIENT_ID eller KEYCLOAK_ADMIN_CLIENT_SECRET',
    })
  }

  return {
    authUrl: normalizeBaseUrl(env.KEYCLOAK_AUTH_URL),
    realm: env.KEYCLOAK_REALM,
    adminClientId: env.KEYCLOAK_ADMIN_CLIENT_ID,
    adminClientSecret: env.KEYCLOAK_ADMIN_CLIENT_SECRET,
    adminClientScope: env.KEYCLOAK_ADMIN_CLIENT_SCOPE,
    targetClientId: env.KEYCLOAK_ADMIN_TARGET_CLIENT_ID ?? env.KEYCLOAK_CLIENT_ID,
  }
}

export class KeycloakAdminClient {
  private readonly authUrl: string
  readonly realm: string
  readonly targetClientId: string
  private readonly http: BearerAuthClient
  private clientUuidPromise: Promise<string> | null = null

  constructor() {
    const cfg = requireAdminEnv()
    if (!cfg.targetClientId) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Keycloak admin API mangler KEYCLOAK_ADMIN_TARGET_CLIENT_ID eller KEYCLOAK_CLIENT_ID',
      })
    }

    this.authUrl = cfg.authUrl
    this.realm = cfg.realm
    this.targetClientId = cfg.targetClientId

    this.http = new BearerAuthClient({
      tokenUrl: `${this.authUrl}/realms/${encodeURIComponent(this.realm)}/protocol/openid-connect/token`,
      clientId: cfg.adminClientId,
      clientSecret: cfg.adminClientSecret,
      extraParams: cfg.adminClientScope ? { scope: cfg.adminClientScope } : undefined,
      timeoutMs: 10_000,
    })
  }

  private adminBaseUrl(): string {
    return `${this.authUrl}/admin/realms/${encodeURIComponent(this.realm)}`
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.http.fetch(`${this.adminBaseUrl()}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init.headers ?? {}),
      },
    })

    const text = await response.text()
    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `Keycloak admin API fejl: ${text.slice(0, 500) || response.statusText}`,
      })
    }

    if (!text) return undefined as T
    return JSON.parse(text) as T
  }

  async getTargetClientUuid(): Promise<string> {
    if (!this.clientUuidPromise) {
      this.clientUuidPromise = this.request<KeycloakClient[]>(`/clients?clientId=${encodeURIComponent(this.targetClientId)}`)
        .then((clients) => {
          const match = clients.find(c => c.clientId === this.targetClientId)
          if (!match?.id) {
            throw createError({
              statusCode: 404,
              statusMessage: `Keycloak client ikke fundet: ${this.targetClientId}`,
            })
          }
          return match.id
        })
    }

    return this.clientUuidPromise
  }

  async listUsers(max = 100, first = 0): Promise<KeycloakUser[]> {
    return this.request<KeycloakUser[]>(`/users?briefRepresentation=true&first=${first}&max=${max}`)
  }

  async listGroups(max = 100, first = 0): Promise<KeycloakGroup[]> {
    return this.request<KeycloakGroup[]>(`/groups?briefRepresentation=true&first=${first}&max=${max}`)
  }

  async listClientRoles(): Promise<KeycloakRole[]> {
    const clientUuid = await this.getTargetClientUuid()
    return this.request<KeycloakRole[]>(`/clients/${encodeURIComponent(clientUuid)}/roles`)
  }

  async findUsersByEmail(email: string): Promise<KeycloakUser[]> {
    return this.request<KeycloakUser[]>(`/users?email=${encodeURIComponent(email)}`)
  }

  async searchGroups(search: string, max = 50): Promise<KeycloakGroup[]> {
    return this.request<KeycloakGroup[]>(`/groups?search=${encodeURIComponent(search)}&max=${max}`)
  }

  async listUserGroups(userId: string): Promise<KeycloakGroup[]> {
    return this.request<KeycloakGroup[]>(`/users/${encodeURIComponent(userId)}/groups`)
  }

  async listUserClientRoles(userId: string): Promise<KeycloakRole[]> {
    const clientUuid = await this.getTargetClientUuid()
    return this.request<KeycloakRole[]>(`/users/${encodeURIComponent(userId)}/role-mappings/clients/${encodeURIComponent(clientUuid)}`)
  }

  async listGroupClientRoles(groupId: string): Promise<KeycloakRole[]> {
    const clientUuid = await this.getTargetClientUuid()
    return this.request<KeycloakRole[]>(`/groups/${encodeURIComponent(groupId)}/role-mappings/clients/${encodeURIComponent(clientUuid)}`)
  }

  async addUserClientRoles(userId: string, roles: KeycloakRole[]): Promise<void> {
    const clientUuid = await this.getTargetClientUuid()
    await this.request<void>(`/users/${encodeURIComponent(userId)}/role-mappings/clients/${encodeURIComponent(clientUuid)}`, {
      method: 'POST',
      body: JSON.stringify(roles),
    })
  }

  async removeUserClientRoles(userId: string, roles: KeycloakRole[]): Promise<void> {
    const clientUuid = await this.getTargetClientUuid()
    await this.request<void>(`/users/${encodeURIComponent(userId)}/role-mappings/clients/${encodeURIComponent(clientUuid)}`, {
      method: 'DELETE',
      body: JSON.stringify(roles),
    })
  }

  async addGroupClientRoles(groupId: string, roles: KeycloakRole[]): Promise<void> {
    const clientUuid = await this.getTargetClientUuid()
    await this.request<void>(`/groups/${encodeURIComponent(groupId)}/role-mappings/clients/${encodeURIComponent(clientUuid)}`, {
      method: 'POST',
      body: JSON.stringify(roles),
    })
  }

  async addUserToGroup(userId: string, groupId: string): Promise<void> {
    await this.request<void>(`/users/${encodeURIComponent(userId)}/groups/${encodeURIComponent(groupId)}`, {
      method: 'PUT',
    })
  }

  async removeGroupClientRoles(groupId: string, roles: KeycloakRole[]): Promise<void> {
    const clientUuid = await this.getTargetClientUuid()
    await this.request<void>(`/groups/${encodeURIComponent(groupId)}/role-mappings/clients/${encodeURIComponent(clientUuid)}`, {
      method: 'DELETE',
      body: JSON.stringify(roles),
    })
  }
}

export function createKeycloakAdminClient(): KeycloakAdminClient {
  return new KeycloakAdminClient()
}

export function resolveRolesByName(allRoles: KeycloakRole[], roleNames: string[]): KeycloakRole[] {
  const requested = Array.from(new Set(roleNames.map(r => r.trim()).filter(Boolean)))
  const roleMap = new Map(allRoles.map(role => [role.name, role]))
  const resolved: KeycloakRole[] = []
  const unknown: string[] = []

  for (const name of requested) {
    const role = roleMap.get(name)
    if (!role) {
      unknown.push(name)
      continue
    }
    resolved.push(role)
  }

  if (unknown.length) {
    throw createError({
      statusCode: 400,
      statusMessage: `Ukendte roller i client scope: ${unknown.join(', ')}`,
    })
  }

  return resolved
}