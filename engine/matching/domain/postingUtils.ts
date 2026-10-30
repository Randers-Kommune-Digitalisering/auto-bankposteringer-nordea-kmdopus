import type { PostingAttachment, PostingLineInput } from '../../posting/domain/posting'
import { extractCprFromText } from '~/lib/text/cpr'
import {
  projectCanonicalTransactionText,
  resolveBankMessage as resolveCanonicalBankMessage,
} from './transactionTextProjection'
import { evaluatePostingTextTemplate } from './postingTextTemplateRe2'
import type { PostingTextTemplate } from './postingTextTemplate'

export type PostingTransactionContext = {
  transactionId: string
  requestLineTransactionId?: string | null
  amount: number
  statusDimensions: Record<string, string>
  entryAdditionalInfo?: string | null
  ntryAcctSvcrRef?: string | null
  ntryRef?: string | null
}

export function buildPostingLines(options: {
  transaction: PostingTransactionContext
  text: string
  cpr?: string
  attachments?: PostingAttachment[]
} & (
  | { landingDimensions: Record<string, string> }
  | { landingLines: Array<{ dimensions: Record<string, string>; amount: number; text?: string; cpr?: string }> }
)): PostingLineInput[] {
  const amountAbs = Math.abs(options.transaction.amount)
  const isIncoming = options.transaction.amount >= 0

  const statusLine: PostingLineInput = {
    transactionId: options.transaction.requestLineTransactionId === undefined
      ? options.transaction.transactionId
      : options.transaction.requestLineTransactionId,
    dimensions: options.transaction.statusDimensions,
    debetOrCredit: isIncoming ? 'Debet' : 'Kredit',
    amount: amountAbs,
    text: truncate(options.text),
  }

  const landingDefinitions =
    'landingLines' in options
      ? options.landingLines
      : [{ dimensions: options.landingDimensions, amount: amountAbs }]

  const landingLines: PostingLineInput[] = landingDefinitions.map((line, index) => ({
    transactionId: options.transaction.requestLineTransactionId === undefined
      ? options.transaction.transactionId
      : options.transaction.requestLineTransactionId,
    dimensions: line.dimensions,
    debetOrCredit: isIncoming ? 'Kredit' : 'Debet',
    amount: Math.abs(line.amount),
    text: truncate(line.text ?? options.text),
    cpr: line.cpr ?? options.cpr,
    attachments: index === 0 && options.attachments?.length ? options.attachments : undefined,
  }))

  return [statusLine, ...landingLines]
}

export function resolvePostingText(
  textTemplate: string | null | undefined,
  tx: PostingTransactionContext,
  dynamicTemplate?: PostingTextTemplate | null,
): string {
  const projection = projectCanonicalTransactionText({
    transactionId: tx.transactionId,
    amount: tx.amount,
    creditDebitIndicator: tx.amount < 0 ? 'DBIT' : 'CRDT',
    entryAdditionalInfo: tx.entryAdditionalInfo,
    ntryAcctSvcrRef: tx.ntryAcctSvcrRef,
    ntryRef: tx.ntryRef,
  })

  if (dynamicTemplate) {
    return evaluatePostingTextTemplate(dynamicTemplate, {
      bankMessage: projection.bankMessage,
      entryAdditionalInfo: tx.entryAdditionalInfo ?? undefined,
    })
  }

  if (!textTemplate) return projection.postingText || tx.transactionId

  const normalized = textTemplate.trim().toLowerCase()
  if (normalized === 'tekst fra bank') return projection.postingText || tx.transactionId
  if (normalized === 'afsender fra bank') return projection.bankMessage || tx.transactionId
  return textTemplate
}

export function resolveBankMessage(tx: PostingTransactionContext): string {
  return resolveCanonicalBankMessage(tx.entryAdditionalInfo ?? null)
}

export function extractCprFromTransaction(tx: PostingTransactionContext): string | undefined {
  return tx.entryAdditionalInfo ? extractCprFromText(tx.entryAdditionalInfo) : undefined
}

function truncate(text: string, length = 50): string {
  return text.length > length ? text.slice(0, length) : text
}
