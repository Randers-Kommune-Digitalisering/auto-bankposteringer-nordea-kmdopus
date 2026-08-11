export type PostingTextPolicyRule = {
  id: string
  marker: string
  maxLength: number
  collapseWhitespace?: boolean
  appendCounterparty?: boolean
}

export const DEFAULT_POSTING_TEXT_POLICY: PostingTextPolicyRule[] = [
  {
    id: 'bdp-reference',
    marker: 'BDP',
    maxLength: 18,
    collapseWhitespace: true,
  },
  {
    id: 'ksd-reference-with-counterparty',
    marker: 'KSD',
    maxLength: 21,
    appendCounterparty: true,
  },
]

export function applyPostingTextPolicy(
  message: string,
  counterparty: string | undefined,
  rules: PostingTextPolicyRule[] = DEFAULT_POSTING_TEXT_POLICY,
): string | null {
  if (!message) {
    return null
  }

  for (const rule of rules) {
    const start = message.indexOf(rule.marker)
    if (start < 0) {
      continue
    }

    let value = message.substring(start, start + rule.maxLength)

    if (rule.collapseWhitespace) {
      value = value.replace(/\s+/g, '')
    }

    if (rule.appendCounterparty) {
      return `${value}${counterparty ?? ''}`.trim()
    }

    return value
  }

  return null
}