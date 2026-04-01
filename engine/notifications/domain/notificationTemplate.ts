import type { MatchableTransaction, RuleAccounting } from '../../matching/handlers/transactionMatchingService'

export type NotificationTemplateContext = {
  tx: MatchableTransaction
  accounting: RuleAccounting
  counterpartName: string
  amountFormatted: string
  bookingDateFormatted: string
  postingText?: string
  dimensions: Array<{ key: string; value: string }>
}

const DEFAULT_TEMPLATE = [
  'Din indbetaling på {{amount}} kr. fra {{counterpart}} er modtaget og er blevet bogført.',
  'Dato: {{bookingDate}}',
  'Posteringstekst: {{postingText}}',
  '',
  'Kontering:',
  '{{all_dimensions}}',
].join('\n')

export function getDefaultNotificationTemplate(): string {
  return DEFAULT_TEMPLATE
}

export function renderNotificationTemplate(template: string, ctx: NotificationTemplateContext): string {
  const safeTemplate = template?.length ? template : DEFAULT_TEMPLATE

  const allDimensions = ctx.dimensions
    .map(d => `${d.key}: ${d.value}`)
    .join('\n')

  return safeTemplate
    .replace(/\{\{\s*amount\s*\}\}/g, ctx.amountFormatted)
    .replace(/\{\{\s*counterpart\s*\}\}/g, ctx.counterpartName)
    .replace(/\{\{\s*bookingDate\s*\}\}/g, ctx.bookingDateFormatted)
    .replace(/\{\{\s*postingText\s*\}\}/g, ctx.postingText ?? '')
    .replace(/\{\{\s*all_dimensions\s*\}\}/g, allDimensions)
}
