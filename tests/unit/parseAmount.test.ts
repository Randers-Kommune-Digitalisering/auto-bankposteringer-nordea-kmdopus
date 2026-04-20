import { describe, expect, it } from 'vitest'
import { parseAmount } from '../../engine/matching/domain/amount'

describe('parseAmount', () => {
  it('parses dot-decimal format (DB numeric)', () => {
    expect(parseAmount('1234.56')).toBeCloseTo(1234.56)
    expect(parseAmount('-0.50')).toBeCloseTo(-0.5)
  })

  it('parses comma-decimal format (da-DK)', () => {
    expect(parseAmount('1234,56')).toBeCloseTo(1234.56)
    expect(parseAmount('-0,50')).toBeCloseTo(-0.5)
  })

  it('parses thousand separators correctly', () => {
    expect(parseAmount('1.234,56')).toBeCloseTo(1234.56)
    expect(parseAmount('1,234.56')).toBeCloseTo(1234.56)
    expect(parseAmount('12 345,67')).toBeCloseTo(12345.67)
  })

  it('handles non-numeric input safely', () => {
    expect(parseAmount('')).toBe(0)
    expect(parseAmount('abc')).toBe(0)
    expect(parseAmount(null)).toBe(0)
  })
})
