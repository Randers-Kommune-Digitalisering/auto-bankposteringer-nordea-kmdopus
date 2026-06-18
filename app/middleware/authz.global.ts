import { requiredRolesForPath, hasAnyRole, canAccessPath } from '~/lib/authz/policy'

export default defineNuxtRouteMiddleware(async (to) => {
  // Leave auth lifecycle routes to nuxt-oidc-auth.
  if (to.path.startsWith('/auth/') || to.path === '/login' || to.path === '/logout') {
    return
  }

  const requiredRoles = requiredRolesForPath(to.path)
  if (!requiredRoles?.length) {
    return
  }

  const oidc = useOidcAuth()
  const { roles } = useAuthz()

  // Ensure session/user is loaded on hard reload/deep-link before role evaluation.
    if (!oidc.user.value || !oidc.loggedIn.value) {
    try {
      await oidc.fetch()
    } catch {
        // If session fetch fails, force login for protected paths.
        return oidc.login(undefined, { callbackRedirectUrl: to.fullPath })
    }
    }

    // If session is still missing after fetch, force login explicitly.
    if (!oidc.user.value || !oidc.loggedIn.value) {
      return oidc.login(undefined, { callbackRedirectUrl: to.fullPath })
  }

  if (!hasAnyRole(roles.value, requiredRoles)) {
    const fallbackPath = canAccessPath('/', roles.value) ? '/' : undefined
    
    if (!fallbackPath || to.path === fallbackPath) {
      return abortNavigation(createError({ statusCode: 403, statusMessage: 'Ingen adgang til siden' }))
    }

    return navigateTo(fallbackPath)
  }
})