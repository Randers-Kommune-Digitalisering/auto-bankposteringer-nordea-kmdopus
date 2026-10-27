import { describe, expect, it } from 'vitest'
import { resolveAccessLogUserIdentity } from '../../server/utils/accessLogIdentity'

describe('resolveAccessLogUserIdentity', () => {
  it('prefers the OIDC preferred username from userInfo', () => {
    expect(resolveAccessLogUserIdentity({
      userInfo: { preferred_username: 'ada.hansen' },
      claims: { preferred_username: 'fallback-user' },
      userName: 'session-user',
    })).toEqual({ userName: 'ada.hansen' })
  })

  it('falls back to claims and then the OIDC session username', () => {
    expect(resolveAccessLogUserIdentity({
      claims: { preferred_username: 'claims-user' },
      userName: 'session-user',
    })).toEqual({ userName: 'claims-user' })

    expect(resolveAccessLogUserIdentity({ userName: 'session-user' }))
      .toEqual({ userName: 'session-user' })
  })

  it('marks sessions without a usable username as unresolved', () => {
    expect(resolveAccessLogUserIdentity({
      userInfo: { preferred_username: '  ' },
      userName: 42,
    })).toEqual({ userLookup: 'unresolved' })
  })
})
