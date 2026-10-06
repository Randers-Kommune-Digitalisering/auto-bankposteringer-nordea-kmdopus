import { describe, expect, it } from 'vitest'
import { isWellFormedXml } from '../../engine/erp-integration/infrastructure/validateXml'

describe('isWellFormedXml', () => {
  it('accepts well-formed XML', () => {
    expect(isWellFormedXml('<FinancePostingRequest><HEADER/></FinancePostingRequest>')).toBe(true)
  })

  it('rejects malformed XML', () => {
    expect(isWellFormedXml('<FinancePostingRequest>')).toBe(false)
  })
})