import { describe, expect, it } from 'vitest'
import { createInsertSchema } from 'drizzle-zod'
import { rule } from '../../app/lib/db/schema/rule'
import { toDbNumericStringOrUndefined } from '../../server/utils/rules/ruleDbValues'

describe('rule database numeric values', () => {
  const insertSchema = createInsertSchema(rule)

  it('converts parsed amounts to the decimal strings expected by Drizzle', () => {
    const amountMin = toDbNumericStringOrUndefined(1250.5)
    const amountMax = toDbNumericStringOrUndefined(2000)

    expect(amountMin).toBe('1250.50')
    expect(amountMax).toBe('2000.00')
    expect(insertSchema.parse({
      type: 'standard',
      status: 'aktiv',
      erpSupplier: 'kmd',
      currentVersionId: 1,
      matchAmountMin: amountMin,
      matchAmountMax: amountMax,
    })).toMatchObject({
      matchAmountMin: '1250.50',
      matchAmountMax: '2000.00',
    })
  })

  it('leaves absent amounts unset and rejects non-finite values', () => {
    expect(toDbNumericStringOrUndefined(undefined)).toBeUndefined()
    expect(toDbNumericStringOrUndefined(null)).toBeUndefined()
    expect(() => toDbNumericStringOrUndefined(Number.NaN)).toThrow('Ugyldigt beløb')
    expect(() => toDbNumericStringOrUndefined(Number.POSITIVE_INFINITY)).toThrow('Ugyldigt beløb')
  })
})
