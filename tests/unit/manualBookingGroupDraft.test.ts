import { describe, expect, it } from 'vitest'
import { manualBookingGroupDraftMemberSignature } from '../../server/utils/manualBookingGroupDraft'

describe('manual booking group draft member signature', () => {
  it('is independent of the order and duplicate IDs in the request', () => {
    const first = [
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
    ]

    expect(manualBookingGroupDraftMemberSignature(first)).toBe(
      manualBookingGroupDraftMemberSignature([first[1]!, first[0]!, first[0]!]),
    )
  })

  it('changes when group membership changes', () => {
    expect(manualBookingGroupDraftMemberSignature(['transaction-a']))
      .not.toBe(manualBookingGroupDraftMemberSignature(['transaction-a', 'transaction-b']))
  })
})
