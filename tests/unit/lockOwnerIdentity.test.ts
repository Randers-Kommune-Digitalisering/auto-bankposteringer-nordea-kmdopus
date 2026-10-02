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

  it('uses a stable development username when a dev session omits its subject', () => {
    expect(resolveLockOwnerIdentity({ userName: 'local-bookkeeper' }, true)).toEqual({
      id: 'development:dev:local-bookkeeper',
      displayName: 'local-bookkeeper',
    })
  })

  it('rejects a missing subject outside development mode', () => {
    expect(() => resolveLockOwnerIdentity({ userName: 'local-bookkeeper' }, false))
      .toThrow('Brugerens OIDC-identitet mangler')
  })
})