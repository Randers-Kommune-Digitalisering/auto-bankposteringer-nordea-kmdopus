import { describe, expect, it } from 'vitest'
import { getApiRequiredRoles } from '../../server/auth/apiAuthorizationPolicy'

describe('getApiRequiredRoles', () => {
  it('leaves only health and OIDC lifecycle endpoints public', () => {
    expect(getApiRequiredRoles('/api/health', 'GET')).toBeNull()
    expect(getApiRequiredRoles('/api/health', 'HEAD')).toBeNull()
    expect(getApiRequiredRoles('/api/_auth/session', 'GET')).toBeNull()
    expect(getApiRequiredRoles('/api/_auth/session', 'POST')).toBeNull()
    expect(getApiRequiredRoles('/api/dashboard', 'GET')).not.toBeNull()
    expect(getApiRequiredRoles('/api/health/extra', 'GET')).not.toBeNull()
  })

  it('applies the UI role groups to protected API areas', () => {
    expect(getApiRequiredRoles('/api/fejlhaandtering/queue', 'GET')).toEqual(['admin', 'dev'])
    expect(getApiRequiredRoles('/api/rules', 'GET')).toEqual(['rule_admin', 'dev'])
    expect(getApiRequiredRoles('/api/banking-agreements/nordea', 'PUT')).toEqual(['admin', 'rule_admin', 'dev'])
    expect(getApiRequiredRoles('/api/runs', 'GET')).toEqual(['admin', 'bookkeeper', 'dev'])
    expect(getApiRequiredRoles('/api/transactions', 'GET')).toEqual(['bookkeeper', 'admin', 'rule_admin', 'dev'])
  })

  it('restricts unclassified API routes instead of making them public', () => {
    expect(getApiRequiredRoles('/api/new-feature', 'GET')).toEqual(['admin', 'dev'])
  })
})