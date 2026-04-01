import type { Ref } from 'vue'

type RolesResponse = { roles?: string[]; username?: string }

export type AppRole = 'requesting' | 'bookkeeping' | 'sys_admin' | 'rule_admin'

export function useAuthz() {
  const roles = useState<AppRole[]>('authz.roles', () => [])
  const username = useState<string | null>('authz.username', () => null)
  const loaded = useState<boolean>('authz.loaded', () => false)

  async function refresh() {
    try {
      const res = await $fetch<RolesResponse>('/api/auth').catch(() => $fetch<RolesResponse>('/api/roles'))
      roles.value = (Array.isArray(res.roles) ? res.roles : []) as AppRole[]
      username.value = res.username ?? null
      loaded.value = true
    } catch {
      roles.value = []
      username.value = null
      loaded.value = true
    }
  }

  function hasAny(required: AppRole[] | undefined): boolean {
    if (!required?.length) return true
    return required.some(r => roles.value.includes(r))
  }

  return {
    roles: roles as Ref<AppRole[]>,
    username: username as Ref<string | null>,
    loaded: loaded as Ref<boolean>,
    refresh,
    hasAny,
  }
}
