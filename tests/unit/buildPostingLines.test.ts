import { describe, expect, it } from 'vitest'

import { buildPostingLines } from '../../engine/matching/domain/postingUtils'

describe('buildPostingLines', () => {
  it('propagates transactionId to all generated posting lines', () => {
    const txId = '00000000-0000-0000-0000-00000000abcd'

    const lines = buildPostingLines({
      transaction: {
        transactionId: txId,
        amount: 123.45,
        statusAccount: '95999999',
      },
      landingAccount: '12345678',
      text: 'Test',
    })

    expect(lines).toHaveLength(2)
    expect(lines[0]?.transactionId).toBe(txId)
    expect(lines[1]?.transactionId).toBe(txId)
  })
})
