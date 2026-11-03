import { describe, expect, it } from 'vitest'
import { resolveLockOwnerIdentity } from '../../server/auth/requireAppRoles'

describe('lock owner identity', () => {
  it('uses OIDC issuer and subject for authenticated users', () => {
    expect(resolveLockOwnerIdentity({
      userInfo: {
        iss: 'https://issuer.example',
        sub: 'subject-123',
        name: 'Ada Hansen',
      },
    }, false)).toEqual({
      id: 'https://issuer.example:subject-123',
      displayName: 'Ada Hansen',
    })
  })

  it('uses the same standard name claims as the dashboard', () => {
    expect(resolveLockOwnerIdentity({
      userInfo: {
        iss: 'https://issuer.example',
        sub: 'subject-123',
        given_name: 'Ada',
        family_name: 'Hansen',
      },
    }, false)).toEqual({
      id: 'https://issuer.example:subject-123',
      displayName: 'Ada Hansen',
    })
  })

  it('supports Keycloak first and last name attributes', () => {
    expect(resolveLockOwnerIdentity({
      userInfo: {
        iss: 'https://issuer.example',
        sub: 'subject-123',
        firstName: 'Ada',
        lastName: 'Hansen',
      },
    }, false)).toEqual({
      id: 'https://issuer.example:subject-123',
      displayName: 'Ada Hansen',
    })
  })

  it('uses a stable development username when a dev session omits its subject', () => {
    expect(resolveLockOwnerIdentity({ userName: 'local-bookkeeper' }, true)).toEqual({
      id: 'development:dev:local-bookkeeper',
      displayName: 'local-bookkeeper',
    })
  })

  it('uses the preferred username when no name claims are available', () => {
    expect(resolveLockOwnerIdentity({
      userInfo: {
        iss: 'https://issuer.example',
        sub: 'subject-123',
      },
      claims: {
        preferred_username: 'ada@example.com',
      },
      userName: 'session-user',
    }, false)).toEqual({
      id: 'https://issuer.example:subject-123',
      displayName: 'ada@example.com',
    })
  })

  it('uses the generic lock owner label when no display name is available', () => {
    expect(resolveLockOwnerIdentity({
      userInfo: {
        iss: 'https://issuer.example',
        sub: 'subject-123',
      },
    }, false)).toEqual({
      id: 'https://issuer.example:subject-123',
      displayName: 'anden bruger',
    })
  })

  it('rejects a missing subject outside development mode', () => {
    expect(() => resolveLockOwnerIdentity({ userName: 'local-bookkeeper' }, false))
      .toThrow('Brugerens OIDC-identitet mangler')
  })
})