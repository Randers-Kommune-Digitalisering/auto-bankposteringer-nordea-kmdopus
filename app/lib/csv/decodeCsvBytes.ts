export type CsvEncoding =
  | 'ASCII-only (UTF-8/Windows-1252)'
  | 'UTF-8'
  | 'UTF-8 (BOM)'
  | 'UTF-16 LE (BOM)'
  | 'UTF-16 BE (BOM)'
  | 'Windows-1252 (ANSI)'

export type DecodedCsv = {
  text: string
  encoding: CsvEncoding
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte)
}

function decodeMarkedEncoding(
  bytes: Uint8Array,
  encoding: 'utf-8' | 'utf-16le' | 'utf-16be',
  label: CsvEncoding,
): DecodedCsv {
  try {
    return {
      text: new TextDecoder(encoding, { fatal: true }).decode(bytes),
      encoding: label,
    }
  } catch (error) {
    if (!(error instanceof TypeError)) throw error
    throw new Error(`CSV-filen er markeret som ${label}, men indeholder ugyldige bytes.`)
  }
}

export function decodeCsvBytes(bytes: Uint8Array): DecodedCsv {
  if (startsWith(bytes, [0xef, 0xbb, 0xbf])) {
    return decodeMarkedEncoding(bytes.subarray(3), 'utf-8', 'UTF-8 (BOM)')
  }
  if (startsWith(bytes, [0xff, 0xfe])) {
    return decodeMarkedEncoding(bytes.subarray(2), 'utf-16le', 'UTF-16 LE (BOM)')
  }
  if (startsWith(bytes, [0xfe, 0xff])) {
    return decodeMarkedEncoding(bytes.subarray(2), 'utf-16be', 'UTF-16 BE (BOM)')
  }

  try {
    const hasNonAsciiBytes = bytes.some(byte => byte >= 0x80)
    return {
      text: new TextDecoder('utf-8', { fatal: true }).decode(bytes),
      encoding: hasNonAsciiBytes ? 'UTF-8' : 'ASCII-only (UTF-8/Windows-1252)',
    }
  } catch (error) {
    if (!(error instanceof TypeError)) throw error
    return {
      text: new TextDecoder('windows-1252').decode(bytes),
      encoding: 'Windows-1252 (ANSI)',
    }
  }
}
