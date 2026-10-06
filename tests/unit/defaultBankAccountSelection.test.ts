import { describe, expect, it } from 'vitest'
import { transitionDefaultBankAccountFilter } from '../../app/lib/banking/defaultBankAccountSelection'

const emptyState = { autoAppliedDefaultId: null, initialized: false }

describe('default bank account filter selection', () => {
  it('applies the configured default once when the filter is empty', () => {
    expect(transitionDefaultBankAccountFilter([], 'account-a', emptyState)).toEqual({
      state: { autoAppliedDefaultId: 'account-a', initialized: true },
      selectedIds: ['account-a'],
    })
  })

  it('preserves an explicit initial selection', () => {
    expect(transitionDefaultBankAccountFilter(['account-b'], 'account-a', emptyState)).toEqual({
      state: { autoAppliedDefaultId: null, initialized: true },
      selectedIds: null,
    })
  })

  it('does not reapply the default after a user clears the automatically selected filter', () => {
    const cleared = transitionDefaultBankAccountFilter(
      [],
      'account-a',
      { autoAppliedDefaultId: 'account-a', initialized: true },
    )

    expect(cleared).toEqual({
      state: { autoAppliedDefaultId: null, initialized: true },
      selectedIds: null,
    })
    expect(transitionDefaultBankAccountFilter([], 'account-a', cleared.state).selectedIds).toBeNull()
  })

  it('updates the filter when the configured default changes and the old value was automatic', () => {
    expect(transitionDefaultBankAccountFilter(
      ['account-a'],
      'account-b',
      { autoAppliedDefaultId: 'account-a', initialized: true },
    )).toEqual({
      state: { autoAppliedDefaultId: 'account-b', initialized: true },
      selectedIds: ['account-b'],
    })
  })
})