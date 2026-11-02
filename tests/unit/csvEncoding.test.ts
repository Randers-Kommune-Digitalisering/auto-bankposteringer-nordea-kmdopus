import { describe, expect, it } from 'vitest'
import { decodeCsvBytes } from '../../app/lib/csv/decodeCsvBytes'

describe('CSV byte encoding detection', () => {
  it('marks ASCII-only data as encoding-ambiguous', () => {
    expect(decodeCsvBytes(new TextEncoder().encode('Name;Value'))).toEqual({
      text: 'Name;Value',
      encoding: 'ASCII-only (UTF-8/Windows-1252)',
    })
  })

  it('detects UTF-8 and preserves Danish characters', () => {
    expect(decodeCsvBytes(new TextEncoder().encode('Navn;værdi\nÆldre;æøå'))).toEqual({
      text: 'Navn;værdi\nÆldre;æøå',
      encoding: 'UTF-8',
    })
  })

  it('recognizes and strips a UTF-8 BOM', () => {
    const bytes = new TextEncoder().encode('Navn;værdi')
    const withBom = new Uint8Array([0xef, 0xbb, 0xbf, ...bytes])

    expect(decodeCsvBytes(withBom)).toEqual({
      text: 'Navn;værdi',
      encoding: 'UTF-8 (BOM)',
    })
  })

  it('decodes Windows-1252 ANSI when the bytes are not valid UTF-8', () => {
    const bytes = Uint8Array.from([0x4e, 0x61, 0x76, 0x6e, 0x3b, 0xe6, 0xf8, 0xe5])

    expect(decodeCsvBytes(bytes)).toEqual({
      text: 'Navn;æøå',
      encoding: 'Windows-1252 (ANSI)',
    })
  })

  it('recognizes UTF-16 little-endian files with a BOM', () => {
    const payload = new Uint8Array([0x4e, 0x00, 0x61, 0x00, 0x76, 0x00, 0x6e, 0x00])
    const bytes = new Uint8Array([0xff, 0xfe, ...payload])

    expect(decodeCsvBytes(bytes)).toEqual({
      text: 'Navn',
      encoding: 'UTF-16 LE (BOM)',
    })
  })

  it('rejects invalid data when a UTF-8 BOM explicitly identifies the encoding', () => {
    const bytes = Uint8Array.from([0xef, 0xbb, 0xbf, 0xe6])

    expect(() => decodeCsvBytes(bytes)).toThrow('markeret som UTF-8 (BOM)')
  })
})
