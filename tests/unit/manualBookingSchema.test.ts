import { describe, expect, it } from 'vitest'

import { manualBookingPayloadSchema } from '../../engine/manual-booking/domain/manualBooking'

describe('manualBookingPayloadSchema', () => {
  it('requires at least one booking line', () => {
    const result = manualBookingPayloadSchema.safeParse({
      lines: [],
      cprType: 'ingen',
    })

    expect(result.success).toBe(false)
  })

  it('accepts a minimal valid payload with one line', () => {
    const result = manualBookingPayloadSchema.safeParse({
      lines: [
        {
          amount: 100,
          dimensions: [{ key: 'artskonto', value: '12345678' }],
        },
      ],
      cprType: 'ingen',
    })

    expect(result.success).toBe(true)
  })
})
