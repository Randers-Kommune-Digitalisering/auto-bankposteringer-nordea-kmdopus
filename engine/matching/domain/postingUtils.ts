import type { PostingAttachment, PostingLineInput } from '../../posting/domain/posting'

export type PostingTransactionContext = {
  transactionId: string
  amount: number
  statusDimensions: Record<string, string>

  // CAMT.053 party + remittance fields used for posting text/counterparty
  debtorName?: string | null
  debtorId?: string | null
  creditorName?: string | null
  creditorId?: string | null
  entryAdditionalInfo?: string | null
  txAdditionalInfo?: string | null
  remittanceUstrd?: string[] | null
  remittanceCreditorReference?: string | null
  remittanceAdditional?: string[] | null
}

export function buildPostingLines(options: {
  transaction: PostingTransactionContext
  landingDimensions: Record<string, string>
  text: string
  cpr?: string
  attachments?: PostingAttachment[]
}): PostingLineInput[] {
  const amountAbs = Math.abs(options.transaction.amount)
  const isIncoming = options.transaction.amount >= 0
  const statusLine: PostingLineInput = {
    transactionId: options.transaction.transactionId,
    dimensions: options.transaction.statusDimensions,
    debetOrCredit: isIncoming ? 'Debet' : 'Kredit',
    amount: amountAbs,
    text: truncate(options.text),
  }

  const landingLine: PostingLineInput = {
    transactionId: options.transaction.transactionId,
    dimensions: options.landingDimensions,
    debetOrCredit: isIncoming ? 'Kredit' : 'Debet',
    amount: amountAbs,
    text: truncate(options.text),
    cpr: options.cpr,
    attachments: options.attachments?.length ? options.attachments : undefined,
  }

  return [statusLine, landingLine]
}

export function resolvePostingText(
  textTemplate: string | null | undefined,
  tx: PostingTransactionContext,
): string {
  const message =
    tx.entryAdditionalInfo ||
    tx.txAdditionalInfo ||
    tx.remittanceCreditorReference ||
    tx.remittanceUstrd?.find(Boolean) ||
    tx.remittanceAdditional?.find(Boolean) ||
    ''

  if (message.includes('BDP')) {
    const start = message.indexOf('BDP')
    return message
      .substring(start, start + 18)
      .replace(/\s+/g, '')
  }

  if (message.includes('KSD')) {
    const start = message.indexOf('KSD')
    const counterpart = resolveCounterpartyName(tx)
    return `${message.substring(start, start + 21)}${counterpart ?? ''}`.trim()
  }

  if (!textTemplate) {
    return message || tx.transactionId
  }

  const normalized = textTemplate.trim().toLowerCase()
  if (normalized === 'tekst fra bank') {
    return message || tx.transactionId
  }

  if (normalized === 'afsender fra bank') {
    return (resolveCounterpartyName(tx) ?? message) || tx.transactionId
  }

  return textTemplate
}

export function resolveCounterpartyName(tx: PostingTransactionContext): string | undefined {
  const isOutgoing = tx.amount < 0
  if (isOutgoing) {
    return (
      tx.creditorName ??
      tx.creditorId ??
      undefined
    )
  }

  return (
    tx.debtorName ??
    tx.debtorId ??
    undefined
  )
}

const CPR_REGEX =
  /(((0[1-9]|[12][0-9]|3[01])(0[13578]|10|12)(\d{2}))|(([0][1-9]|[12][0-9]|30)(0[469]|11)(\d{2}))|((0[1-9]|1[0-9]|2[0-8])(02)(\d{2}))|((29)(02)(00))|((29)(02)([2468][048]))|((29)(02)([13579][26])))[-]*\d{4}/gm

export function extractCprFromTransaction(tx: PostingTransactionContext): string | undefined {
  const haystacks = [
    tx.entryAdditionalInfo,
    tx.txAdditionalInfo,
    tx.remittanceCreditorReference,
    ...(tx.remittanceUstrd ?? []),
    ...(tx.remittanceAdditional ?? []),
  ].filter(Boolean) as string[]

  for (const value of haystacks) {
    const match = value.match(CPR_REGEX)
    if (match?.length) {
      return match[0].replace('-', '')
    }
  }

  return undefined
}

function truncate(text: string, length = 50): string {
  return text.length > length ? text.slice(0, length) : text
}
