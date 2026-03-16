import { describe, expect, it } from 'vitest'

import { allowRoleGatedWork, getAppRole } from '../../server/utils/appRole'

describe('appRole', () => {
  it('defaults APP_ROLE to web', () => {
    expect(getAppRole({} as any)).toBe('web')
    expect(getAppRole({ APP_ROLE: '' } as any)).toBe('web')
    expect(getAppRole({ APP_ROLE: 'unknown' } as any)).toBe('web')
  })

  it('accepts valid roles', () => {
    expect(getAppRole({ APP_ROLE: 'web' } as any)).toBe('web')
    expect(getAppRole({ APP_ROLE: 'scheduler' } as any)).toBe('scheduler')
    expect(getAppRole({ APP_ROLE: 'worker' } as any)).toBe('worker')
  })

  it('prefers APP_ROLE over ENABLE_SCHEDULED_TASKS', () => {
    expect(allowRoleGatedWork('scheduler', { APP_ROLE: 'web', ENABLE_SCHEDULED_TASKS: '1' } as any)).toBe(false)
    expect(allowRoleGatedWork('scheduler', { APP_ROLE: 'scheduler', ENABLE_SCHEDULED_TASKS: '0' } as any)).toBe(true)
  })

  it('falls back to ENABLE_SCHEDULED_TASKS when APP_ROLE is unset', () => {
    expect(allowRoleGatedWork('scheduler', { ENABLE_SCHEDULED_TASKS: '1' } as any)).toBe(true)
    expect(allowRoleGatedWork('worker', { ENABLE_SCHEDULED_TASKS: '0' } as any)).toBe(false)
  })
})
