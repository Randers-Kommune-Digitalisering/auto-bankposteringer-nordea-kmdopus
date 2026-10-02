import { XMLParser, XMLValidator } from 'fast-xml-parser'

export type KmdPostingDocumentOutcome = {
  documentNumber: string
  status: 'accepted' | 'rejected' | 'unknown'
  messages: Array<{
    type: string
    number: string
    text: string
  }>
}

export type KmdPostingResponse = {
  status: 'success' | 'partial' | 'error' | 'unknown'
  statusText: string
  counts: {
    received: number | null
    accepted: number | null
    rejected: number | null
  }
  fileMessages: Array<{
    type: string
    number: string
    text: string
  }>
  documents: KmdPostingDocumentOutcome[]
}

type RawReturn = {
  RECEIV_DOC?: unknown
  MESSAGE_TYPE?: unknown
  MESSAGE_NUM?: unknown
  MESSAGE_TEXT?: unknown
}

const parser = new XMLParser({
  ignoreAttributes: true,
  removeNSPrefix: true,
  trimValues: true,
  isArray: tagName => tagName === 'RETURN',
})

function text(value: unknown): string {
  if (value == null || typeof value === 'object') return ''
  return String(value).trim()
}

function countFrom(messages: Array<{ number: string; text: string }>, messageNumber: string): number | null {
  const message = messages.find(item => item.number === messageNumber)
  if (!message) return null
  const match = message.text.match(/:\s*(\d+)\s*$/)
  return match ? Number(match[1]) : null
}

function isErrorType(type: string): boolean {
  return type === 'E' || type === 'A'
}

export function parseKmdPostingResponse(xml: string): KmdPostingResponse {
  const validation = XMLValidator.validate(xml)
  if (validation !== true) {
    throw new Error(`Invalid KMD posting response XML: ${validation.err.msg}`)
  }

  const parsed = parser.parse(xml) as Record<string, unknown>
  const root = parsed.FinancePostingResponse as { RETURN?: RawReturn[] } | undefined
  if (!root || !Array.isArray(root.RETURN)) {
    throw new Error('KMD posting response is missing FinancePostingResponse/RETURN')
  }

  const returns = root.RETURN.map(item => ({
    documentNumber: text(item.RECEIV_DOC),
    type: text(item.MESSAGE_TYPE),
    number: text(item.MESSAGE_NUM),
    text: text(item.MESSAGE_TEXT),
  }))
  const fileMessages = returns
    .filter(item => !item.documentNumber)
    .map(({ type, number, text: messageText }) => ({ type, number, text: messageText }))

  const documentMap = new Map<string, KmdPostingDocumentOutcome>()
  for (const item of returns) {
    if (!item.documentNumber) continue
    const current = documentMap.get(item.documentNumber) ?? {
      documentNumber: item.documentNumber,
      status: 'unknown' as const,
      messages: [],
    }
    current.messages.push({ type: item.type, number: item.number, text: item.text })
    if (isErrorType(item.type)) current.status = 'rejected'
    else if (item.type === 'I' && current.status !== 'rejected') current.status = 'accepted'
    documentMap.set(item.documentNumber, current)
  }

  const documents = [...documentMap.values()]
  const receivedFromMessages = countFrom(fileMessages, '201')
  const acceptedFromMessages = countFrom(fileMessages, '202')
  const rejectedFromMessages = countFrom(fileMessages, '203')
  const acceptedDocuments = documents.filter(item => item.status === 'accepted').length
  const rejectedDocuments = documents.filter(item => item.status === 'rejected').length
  const received = receivedFromMessages ?? (documents.length || null)
  const accepted = acceptedFromMessages ?? (documents.length ? acceptedDocuments : null)
  const rejected = rejectedFromMessages ?? (documents.length ? rejectedDocuments : null)
  const counts = {
    received,
    accepted,
    rejected: rejected ?? (received != null && accepted != null ? Math.max(0, received - accepted) : null),
  }

  const hasFileError = fileMessages.some(message => isErrorType(message.type))
  let status: KmdPostingResponse['status'] = 'unknown'
  if (counts.rejected != null && counts.rejected > 0) {
    status = counts.accepted != null && counts.accepted > 0 ? 'partial' : 'error'
  } else if (hasFileError || rejectedDocuments > 0) {
    status = acceptedDocuments > 0 ? 'partial' : 'error'
  } else if (counts.accepted != null && counts.accepted > 0 && (counts.received == null || counts.accepted === counts.received)) {
    status = 'success'
  } else if (documents.length && documents.every(item => item.status === 'accepted')) {
    status = 'success'
  } else if (returns.some(item => item.number === '204')) {
    status = 'success'
  }

  const statusText = status === 'success'
    ? `OK: ${counts.accepted ?? acceptedDocuments}/${counts.received ?? documents.length} bilag godkendt`
    : status === 'partial'
      ? `FEJL: ${counts.accepted ?? acceptedDocuments} godkendt, ${counts.rejected ?? rejectedDocuments} afvist`
      : status === 'error'
        ? `FEJL: ${counts.rejected ?? rejectedDocuments} bilag afvist`
        : 'Ukendt ERP-svar'

  return { status, statusText, counts, fileMessages, documents }
}