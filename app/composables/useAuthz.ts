import type { Ref } from 'vue'
import type { AppRole } from '~/lib/authz/roles'
import { resolveAppRolesFromSession, hasAnyRole } from '~/lib/authz/roles'

function toRecord(input: unknown): Record<string, unknown> {
  return input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
}

function resolveUsernameFromOidcUser(user: unknown): string | null {
  const record = toRecord(user)
  const userInfo = toRecord(record.userInfo)

  const preferred = userInfo.preferred_username
  if (typeof preferred === 'string' && preferred.trim().length > 0) return preferred

  const username = record.userName
  if (typeof username === 'string' && username.trim().length > 0) return username

  const email = userInfo.email
  if (typeof email === 'string' && email.trim().length > 0) return email

  return null
}

export function useAuthz() {
  const roles = useState<AppRole[]>('authz.roles', () => [])
  const username = useState<string | null>('authz.username', () => null)
  const loaded = useState<boolean>('authz.loaded', () => false)
  const oidc = useOidcAuth()

  function syncFromCurrentUser() {
    roles.value = resolveAppRolesFromSession(oidc.user.value, {
      clientId: useRuntimeConfig().public?.oidcClientId,
    })
    username.value = resolveUsernameFromOidcUser(oidc.user.value)
    loaded.value = true
  }

  async function refresh() {
    try {
      await oidc.fetch()
      syncFromCurrentUser()
    } catch {
      roles.value = []
      username.value = null
      loaded.value = true
    }
  }

  watch(
    () => oidc.user.value,
    () => {
      syncFromCurrentUser()
    },
    { immediate: true },
  )

  function hasAny(required: AppRole[] | undefined): boolean {
    return hasAnyRole(roles.value, required ?? [])
  }

  return {
    roles: roles as Ref<AppRole[]>,
    username: username as Ref<string | null>,
    loaded: loaded as Ref<boolean>,
    refresh,
    hasAny,
  }
}
