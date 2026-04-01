import { describe, expect, it } from 'vitest'
import { authFromProxyHeaders } from '../../server/auth/keycloakAuth'

describe('oauth2-proxy xauthrequest mapping', () => {
  it('returns null when user header missing', () => {
    const ctx = authFromProxyHeaders({ groups: '/x/y' }, '/auto-bankposteringer-nordea-kmdopus-adgang')
    expect(ctx).toBeNull()
  })

  it('maps allowed child groups to roles', () => {
    const ctx = authFromProxyHeaders(
      {
        user: 'alice',
        groups: [
          '/auto-bankposteringer-nordea-kmdopus-adgang/sys_admin',
          '/auto-bankposteringer-nordea-kmdopus-adgang/bookkeeping',
          '/some-other-app/rule_admin',
        ].join(', '),
      },
      '/auto-bankposteringer-nordea-kmdopus-adgang',
    )

    expect(ctx).toEqual({ username: 'alice', roles: expect.arrayContaining(['sys_admin', 'bookkeeping']) })
    expect(ctx?.roles).not.toContain('rule_admin')
  })

  it('handles prefix with trailing slash', () => {
    const ctx = authFromProxyHeaders(
      {
        user: 'bob',
        groups: '/auto-bankposteringer-nordea-kmdopus-adgang/rule_admin',
      },
      '/auto-bankposteringer-nordea-kmdopus-adgang/',
    )

    expect(ctx?.roles).toEqual(['rule_admin'])
  })

  it('returns empty roles when groups header is absent', () => {
    const ctx = authFromProxyHeaders({ user: 'carol' }, '/auto-bankposteringer-nordea-kmdopus-adgang')
    expect(ctx).toEqual({ username: 'carol', roles: [] })
  })
})
