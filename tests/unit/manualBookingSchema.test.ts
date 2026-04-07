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

  it('rejects invalid CPR when provided', () => {
    const result = manualBookingPayloadSchema.safeParse({
      lines: [
        {
          amount: 100,
          dimensions: [{ key: 'artskonto', value: '12345678' }],
        },
      ],
      cprType: 'statisk',
      cprNumber: '123',
    })

    expect(result.success).toBe(false)
  })

  it('accepts a strict CPR (DDMMÅÅXXXX)', () => {
    const result = manualBookingPayloadSchema.safeParse({
      lines: [
        {
          amount: 100,
          dimensions: [{ key: 'artskonto', value: '12345678' }],
        },
      ],
      cprType: 'statisk',
      cprNumber: '0102031234',
    })

    expect(result.success).toBe(true)
  })

  it('rejects CPR with hyphen (strict format)', () => {
    const result = manualBookingPayloadSchema.safeParse({
      lines: [
        {
          amount: 100,
          dimensions: [{ key: 'artskonto', value: '12345678' }],
        },
      ],
      cprType: 'statisk',
      cprNumber: '010203-1234',
    })

    expect(result.success).toBe(false)
  })
})
