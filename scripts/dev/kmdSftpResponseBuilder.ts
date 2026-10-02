import { XMLParser } from 'fast-xml-parser'
import { Builder } from 'xml2js'

export type KmdSftpMockMode = 'random' | 'success' | 'mixed' | 'error'

type RequestDocument = {
  HEADER?: {
    RECEIV_DOC?: unknown
    PSTNG_DATE?: unknown
    COMP_CODE?: unknown
  }
}

type ParsedRequest = {
  CONTROL_FIELDS?: {
    SENDERID?: unknown
    RECEIVER?: unknown
    FILE_NAME?: unknown
    SEND_DATE?: unknown
    SEND_TIME?: unknown
  }
  POSTING_DOCUMENT?: RequestDocument[]
}

const requestParser = new XMLParser({
  ignoreAttributes: true,
  removeNSPrefix: true,
  trimValues: true,
  isArray: tagName => tagName === 'POSTING_DOCUMENT',
})

const responseBuilder = new Builder({
  xmldec: { version: '1.0', encoding: 'UTF-8' },
  renderOpts: { pretty: true },
})

function asText(value: unknown): string {
  if (value == null || typeof value === 'object') return ''
  return String(value).trim()
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

function dateParts(date: string): { iso: string; dotted: string; year: string } {
  const compact = date.replaceAll('-', '')
  if (/^\d{8}$/.test(compact)) {
    const year = compact.slice(0, 4)
    const month = compact.slice(4, 6)
    const day = compact.slice(6, 8)
    return { iso: `${year}-${month}-${day}`, dotted: `${day}.${month}.${year}`, year }
  }
  return { iso: date, dotted: date, year: date.slice(0, 4) }
}

function timeParts(time: string): { xml: string; display: string } {
  const compact = time.replaceAll(':', '')
  if (/^\d{6}$/.test(compact)) {
    return {
      xml: `${compact.slice(0, 2)}:${compact.slice(2, 4)}:${compact.slice(4, 6)}`,
      display: `${compact.slice(0, 2)}:${compact.slice(2, 4)}`,
    }
  }
  return { xml: time, display: time }
}

function rejectedIndexes(count: number, mode: KmdSftpMockMode, random: () => number): Set<number> {
  if (mode === 'success') return new Set()
  if (mode === 'error') return new Set(Array.from({ length: count }, (_, index) => index))
  if (mode === 'mixed') {
    return new Set([count === 1 ? 0 : Math.floor(random() * count)])
  }
  return new Set(Array.from({ length: count }, (_, index) => random() < 0.35 ? index : -1).filter(index => index >= 0))
}

export function buildKmdSftpResponse(
  requestXml: string,
  fallbackFilename: string,
  mode: KmdSftpMockMode = 'random',
  random: () => number = Math.random,
): { filename: string; xml: string; accepted: number; rejected: number } {
  const parsed = requestParser.parse(requestXml) as Record<string, ParsedRequest>
  const request = parsed.FinancePostingRequest
  if (!request) throw new Error('Request is missing FinancePostingRequest root element')

  const control = request.CONTROL_FIELDS ?? {}
  const documents = asArray(request.POSTING_DOCUMENT)
  if (!documents.length) throw new Error('Request does not contain POSTING_DOCUMENT')

  const filename = asText(control.FILE_NAME) || fallbackFilename
  const rawDate = asText(control.SEND_DATE) || asText(documents[0]?.HEADER?.PSTNG_DATE)
  const rawTime = asText(control.SEND_TIME) || '000000'
  const date = dateParts(rawDate)
  const time = timeParts(rawTime)
  const failed = rejectedIndexes(documents.length, mode, random)
  const accepted = documents.length - failed.size
  const rejected = failed.size
  const firmCode = asText(documents[0]?.HEADER?.COMP_CODE) || '0020'

  const returns: Array<Record<string, string>> = [
    {
      RECEIV_DOC: '', POSNR_ACC: '0000000000', MESSAGE_TYPE: 'I', MESSAGE_CLASS: 'ZFIR_EXTPOST',
      MESSAGE_NUM: '200', MESSAGE_TEXT: `Statistik: ${date.dotted} ${time.display}`,
    },
    {
      RECEIV_DOC: '', POSNR_ACC: '0000000000', MESSAGE_TYPE: 'I', MESSAGE_CLASS: 'ZFIR_EXTPOST',
      MESSAGE_NUM: '201', MESSAGE_TEXT: `Antal modtagne bilag: ${String(documents.length).padStart(4, '0')}`,
    },
    {
      RECEIV_DOC: '', POSNR_ACC: '0000000000', MESSAGE_TYPE: 'I', MESSAGE_CLASS: 'ZFIR_EXTPOST',
      MESSAGE_NUM: '202', MESSAGE_TEXT: `Antal godkendte bilag: ${String(accepted).padStart(4, '0')}`,
    },
  ]

  if (rejected > 0) {
    returns.push({
      RECEIV_DOC: '', POSNR_ACC: '0000000000', MESSAGE_TYPE: 'I', MESSAGE_CLASS: 'ZFIR_EXTPOST',
      MESSAGE_NUM: '203', MESSAGE_TEXT: `Antal afviste bilag: ${String(rejected).padStart(4, '0')}`,
    })
  } else {
    returns.push({
      RECEIV_DOC: '', POSNR_ACC: '0000000000', MESSAGE_TYPE: 'I', MESSAGE_CLASS: 'ZFIR_EXTPOST',
      MESSAGE_NUM: '204', MESSAGE_TEXT: 'Fil modtaget uden fejl',
    })
  }

  returns.push({
    RECEIV_DOC: '', POSNR_ACC: '0000000000', MESSAGE_TYPE: 'I', MESSAGE_CLASS: 'ZFIR_EXTPOST',
    MESSAGE_NUM: '002', MESSAGE_TEXT: `Fil: ${rawDate} ${rawTime} ${filename}`,
  })

  documents.forEach((document, index) => {
    const documentNumber = asText(document.HEADER?.RECEIV_DOC) || String(index + 1).padStart(8, '0')
    if (failed.has(index)) {
      returns.push({
        RECEIV_DOC: documentNumber, POSNR_ACC: '0000000000', MESSAGE_TYPE: 'E', MESSAGE_CLASS: 'ZFIR_EXTPOST',
        MESSAGE_NUM: '301', MESSAGE_TEXT: `Bilagsnr. ${documentNumber} ${date.year} er tidligere modtaget`,
      })
      return
    }

    returns.push({
      RECEIV_DOC: documentNumber, POSNR_ACC: '0000000000', MESSAGE_TYPE: 'I', MESSAGE_CLASS: 'ZFIR_EXTPOST',
      MESSAGE_NUM: '305', MESSAGE_TEXT: `Firmakode ${firmCode} bilagsnr. ${documentNumber} pr. ${date.dotted} modtaget uden fejl`,
    })
  })

  const xml = responseBuilder.buildObject({
    'ns1:FinancePostingResponse': {
      $: { 'xmlns:ns1': 'http://kmd.dk/fir/posting/external' },
      CONTROL_FIELDS: {
        SENDERID: asText(control.SENDERID),
        RECEIVER: asText(control.RECEIVER),
        FILE_NAME: filename,
        SEND_DATE: date.iso,
        SEND_TIME: time.xml,
      },
      RETURN: returns,
    },
  })

  return { filename, xml, accepted, rejected }
}