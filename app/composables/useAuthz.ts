export function useAuthz() {
  const { user } = useOidcAuth()

  function toStringRoles(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((role): role is string => typeof role === 'string' && role.trim().length > 0)
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      return [value]
    }

    return []
  }

  const roles = computed<string[]>(() => {
    const claimRoles = toStringRoles(user.value?.claims?.roles)
    const userInfoRoles = toStringRoles(user.value?.userInfo?.roles)

    return Array.from(new Set([...claimRoles, ...userInfoRoles]))
  })

  function hasAny(required: readonly string[]) {
    return required.some(role => roles.value.includes(role))
  }

  return {
    user,
    roles,
    hasAny,
  }
}