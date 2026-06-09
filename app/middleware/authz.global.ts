import { requiredRolesForPath } from '~/lib/authz/policy'
import type { AppRole } from '~/lib/authz/roles'
import { hasAnyRole } from '~/lib/authz/roles'
import { useAuthz } from '~/composables/useAuthz'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/auth/') || to.path === '/ingen-adgang' || to.path === '/login' || to.path === '/logout') return

  const metaRoles = Array.isArray(to.meta?.requiredRoles) ? (to.meta.requiredRoles as AppRole[]) : undefined
  const requiredRoles = metaRoles?.length ? metaRoles : requiredRolesForPath(to.path)
  if (!requiredRoles?.length) return

  const { refresh, roles } = useAuthz()
  const oidc = useOidcAuth()

  await refresh()
  if (!oidc.loggedIn.value) return

  const userRoles = roles.value as AppRole[]
  if (!hasAnyRole(userRoles, requiredRoles)) {
    return navigateTo('/ingen-adgang')
  }
})
