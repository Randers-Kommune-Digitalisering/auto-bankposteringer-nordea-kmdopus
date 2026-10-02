import { describe, expect, it } from 'vitest'

import { anonymizeCprInText, extractCprFromText } from '../../app/lib/text/cpr'
import { buildPostingLines, extractCprFromTransaction, resolvePostingText } from '../../engine/matching/domain/postingUtils'

describe('CPR text helpers', () => {
  it('extracts the first CPR with the same normalization used by matching', () => {
    expect(extractCprFromText('NOTICE 010203-1234 then 0203045678')).toBe('0102031234')
  })

  it('anonymizes every CPR with or without a hyphen', () => {
    expect(anonymizeCprInText('010203-1234 and 0203045678')).toBe('[CPR REDACTED] and [CPR REDACTED]')
  })

  it('only anonymizes CPRs surrounded by non-alphanumeric characters', () => {
    expect(anonymizeCprInText('(010203-1234), 0203045678.')).toBe('([CPR REDACTED]), [CPR REDACTED].')
    expect(anonymizeCprInText('X0102031234Y 12301020312345 Æ0102031234ø'))
      .toBe('X0102031234Y 12301020312345 Æ0102031234ø')
  })
})

describe('buildPostingLines', () => {
  it('propagates transactionId to all generated posting lines', () => {
    const txId = '00000000-0000-0000-0000-00000000abcd'

    const lines = buildPostingLines({
      transaction: {
        transactionId: txId,
        amount: 123.45,
        statusDimensions: { artskonto: '95999999' },
      },
      landingDimensions: { artskonto: '12345678' },
      text: 'Test',
    })

    expect(lines).toHaveLength(2)
    expect(lines[0]?.transactionId).toBe(txId)
    expect(lines[1]?.transactionId).toBe(txId)
  })

  it('supports multiple landing lines and attaches files once', () => {
    const txId = '00000000-0000-0000-0000-00000000abcd'

    const lines = buildPostingLines({
      transaction: {
        transactionId: txId,
        amount: 100,
        statusDimensions: { artskonto: '95999999' },
      },
      landingLines: [
        { dimensions: { artskonto: '11111111' }, amount: 60 },
        { dimensions: { artskonto: '22222222' }, amount: 40 },
      ],
      text: 'Test',
      attachments: [{ name: 'a.pdf', type: 'pdf', data: 'base64' }],
    })

    expect(lines).toHaveLength(3)
    expect(lines.every((l) => l.transactionId === txId)).toBe(true)
    expect(lines[0]?.amount).toBe(100)
    expect(lines[1]?.amount).toBe(60)
    expect(lines[2]?.amount).toBe(40)
    expect(lines[1]?.attachments?.length).toBe(1)
    expect(lines[2]?.attachments).toBeUndefined()
  })

  it('prefers remittance text over technical entry additional info', () => {
    const text = resolvePostingText(undefined, {
      transactionId: '00000000-0000-0000-0000-00000000beef',
      amount: 100,
      statusDimensions: { artskonto: '95999999' },
      entryAdditionalInfo: '502:REFERENCE:63470645-20260804;804:NOTICE NUMBER:',
      remittanceUstrd: ['63470645-20260804'],
      debtorName: 'BAMBORA AB',
    })

    expect(text).toBe('BAMBORA AB — 63470645-20260804')
  })

  it('prefers remittance text for template "tekst fra bank"', () => {
    const text = resolvePostingText('tekst fra bank', {
      transactionId: '00000000-0000-0000-0000-00000000beef',
      amount: 100,
      statusDimensions: { artskonto: '95999999' },
      entryAdditionalInfo: '502:REFERENCE:63470645-20260804;804:NOTICE NUMBER:',
      remittanceUstrd: ['63470645-20260804'],
      debtorName: 'BAMBORA AB',
    })

    expect(text).toBe('BAMBORA AB — 63470645-20260804')
  })

  it('applies BDP policy and strips whitespace', () => {
    const text = resolvePostingText(undefined, {
      transactionId: '00000000-0000-0000-0000-00000000beef',
      amount: 100,
      statusDimensions: { artskonto: '95999999' },
      txAdditionalInfo: 'foo BDP12345678901234567890 bar',
    })

    expect(text).toBe('BDP123456789012345')
  })

  it('applies KSD policy and appends counterparty', () => {
    const text = resolvePostingText(undefined, {
      transactionId: '00000000-0000-0000-0000-00000000beef',
      amount: 100,
      statusDimensions: { artskonto: '95999999' },
      txAdditionalInfo: 'foo KSD12345678901234567890 bar',
      debtorName: 'BORGER NAVN',
    })

    expect(text).toBe('KSD123456789012345678BORGER NAVN')
  })

  it('keeps explicit booking text as highest override', () => {
    const text = resolvePostingText('Manuel posteringstekst', {
      transactionId: '00000000-0000-0000-0000-00000000beef',
      amount: 100,
      statusDimensions: { artskonto: '95999999' },
      txAdditionalInfo: 'foo BDP12345678901234567890 bar',
      debtorName: 'BORGER NAVN',
    })

    expect(text).toBe('Manuel posteringstekst')
  })

  it.each([
    ['entryAdditionalInfo', { entryAdditionalInfo: 'NOTICE 0102031234' }],
    ['txAdditionalInfo', { txAdditionalInfo: 'NOTICE 0102031234' }],
    ['remittanceUstrd', { remittanceUstrd: ['NOTICE 0102031234'] }],
    ['remittanceAdditional', { remittanceAdditional: ['NOTICE 0102031234'] }],
  ])('extracts CPR from %s', (_field, fields) => {
    expect(extractCprFromTransaction({
      transactionId: '00000000-0000-0000-0000-00000000beef',
      amount: 100,
      statusDimensions: {},
      ...fields,
    })).toBe('0102031234')
  })

  it('does not scan structured creditor references for CPR', () => {
    expect(extractCprFromTransaction({
      transactionId: '00000000-0000-0000-0000-00000000beef',
      amount: 100,
      statusDimensions: {},
      remittanceCreditorReference: '0102031234',
    })).toBeUndefined()
  })
})
