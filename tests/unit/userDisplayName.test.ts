import { describe, expect, it } from 'vitest'
import { resolveUserDisplayName } from '../../app/lib/authz/userDisplayName'

describe('resolveUserDisplayName', () => {
  it('uses the full name from OIDC user info', () => {
    expect(resolveUserDisplayName({
      userInfo: { name: 'Ada Lovelace' },
      userName: 'ada@example.com',
    })).toBe('Ada Lovelace')
  })

  it('combines standard given and family name claims', () => {
    expect(resolveUserDisplayName({
      userInfo: { given_name: 'Ada', family_name: 'Lovelace' },
    })).toBe('Ada Lovelace')
  })

  it('supports Keycloak firstName and lastName attributes', () => {
    expect(resolveUserDisplayName({
      userInfo: { firstName: 'Ada', lastName: 'Lovelace' },
    })).toBe('Ada Lovelace')
  })

  it('falls back to the username when name claims are unavailable', () => {
    expect(resolveUserDisplayName({
      userInfo: { name: ' ' },
      userName: 'ada@example.com',
    })).toBe('ada@example.com')
  })

  it('uses a generic label when there is no user information', () => {
    expect(resolveUserDisplayName(undefined)).toBe('Bruger')
  })
})
