import { describe, expect, it } from 'vitest'

import { extractRolesFromOidcUser } from '../../app/lib/authz/extractRoles'

function createJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${header}.${body}.`
}

describe('extractRolesFromOidcUser', () => {
  it('extracts and deduplicates roles from claims and userInfo', () => {
    const roles = extractRolesFromOidcUser({
      claims: { roles: ['bookkeeper', 'admin'] },
      userInfo: { roles: ['admin', 'dev'] },
    })

    expect(roles).toEqual(['bookkeeper', 'admin', 'dev'])
  })

  it('extracts Keycloak client roles from access token resource_access for configured client', () => {
    const accessToken = createJwt({
      resource_access: {
        fobi: { roles: ['rule_admin', 'bookkeeper'] },
        account: { roles: ['manage-account'] },
      },
    })

    const roles = extractRolesFromOidcUser({ accessToken }, { clientId: 'fobi' })

    expect(roles).toEqual(['rule_admin', 'bookkeeper'])
  })

  it('falls back to all resource_access clients when client id is missing', () => {
    const accessToken = createJwt({
      resource_access: {
        fobi: { roles: ['rule_admin'] },
        account: { roles: ['manage-account'] },
      },
    })

    const roles = extractRolesFromOidcUser({ accessToken })

    expect(roles).toEqual(['rule_admin', 'manage-account'])
  })

  it('returns empty roles for malformed access token', () => {
    const roles = extractRolesFromOidcUser({ accessToken: 'invalid-token' })

    expect(roles).toEqual([])
  })

  it('can inject dev role explicitly', () => {
    const roles = extractRolesFromOidcUser({}, { includeDevRole: true })

    expect(roles).toEqual(['dev'])
  })
})
