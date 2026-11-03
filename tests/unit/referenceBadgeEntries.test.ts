import { describe, expect, it } from 'vitest'
import { toCanonicalReferenceBadgeEntries } from '../../app/lib/presenters/referenceBadgeEntries'

describe('toCanonicalReferenceBadgeEntries', () => {
  it('omits NtryRef while preserving other entry references', () => {
    const entries = toCanonicalReferenceBadgeEntries([
      { source: '/Ntry/NtryRef', value: 'RUNNING-NUMBER-1' },
      { source: '/Ntry/AcctSvcrRef', value: 'BANK-REFERENCE-1' },
    ])

    expect(entries).toEqual([
      { value: 'BANK-REFERENCE-1', hint: '/Ntry/AcctSvcrRef' },
    ])
  })
})
