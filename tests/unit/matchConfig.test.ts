import { describe, expect, it } from 'vitest'
import { matchFieldOptionsByCategory } from '../../app/lib/rules/match-config'

describe('match field options', () => {
  it('does not offer NtryRef as a selectable matching field', () => {
    const referenceOptions = matchFieldOptionsByCategory.Reference

    expect(referenceOptions.some((option) => option.value === 'ntry_ref')).toBe(false)
  })
})
