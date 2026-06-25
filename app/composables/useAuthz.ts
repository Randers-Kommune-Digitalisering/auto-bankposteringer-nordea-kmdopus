import { extractRolesFromOidcUser } from '~/lib/authz/extractRoles'

export function useAuthz() {
  const { user } = useOidcAuth()
  const runtimeConfig = useRuntimeConfig()

  const roles = computed<string[]>(() => {
    return extractRolesFromOidcUser(user.value ?? {}, {
      clientId: runtimeConfig.public.oidcClientId,
      includeDevRole: runtimeConfig.public.devAuthBypass === true,
    })
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