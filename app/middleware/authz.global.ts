import { useAuthz } from '~/composables/useAuthz'

export default defineNuxtRouteMiddleware(async (to) => {
  // Public routes
  if (to.path === '/login' || to.path === '/api/health' || to.path === '/ingen-adgang') return

  const { loaded, refresh, hasAny } = useAuthz()
  if (!loaded.value) {
    await refresh()
  }

  // Route → role mapping (minimal, adjust as needed)
  const roleRequirements: Array<{ prefix: string; roles: Array<'requesting' | 'bookkeeping' | 'sys_admin' | 'rule_admin'> }>
    = [
      { prefix: '/indstillinger', roles: ['sys_admin', 'rule_admin'] },
      { prefix: '/fejlhaandtering', roles: ['sys_admin'] },
      { prefix: '/konteringsregler', roles: ['rule_admin'] },
      { prefix: '/aabne-poster', roles: ['bookkeeping'] },
      { prefix: '/kontoudtog', roles: ['bookkeeping', 'sys_admin', 'rule_admin'] },
      { prefix: '/koersler', roles: ['sys_admin', 'bookkeeping'] },
      { prefix: '/', roles: ['bookkeeping', 'sys_admin', 'rule_admin'] },
    ]

  const match = roleRequirements.find(r => to.path === r.prefix || to.path.startsWith(`${r.prefix}/`))
  if (match && !hasAny(match.roles as any)) {
    return navigateTo('/ingen-adgang')
  }
})
