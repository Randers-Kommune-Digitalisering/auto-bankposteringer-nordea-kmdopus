import crypto from 'node:crypto'

export function hashForLog(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16)
}

export function emailDomain(value: string): string | undefined {
  const trimmed = value.trim()
  const at = trimmed.lastIndexOf('@')
  if (at < 0) return undefined
  const domain = trimmed.slice(at + 1).trim().toLowerCase()
  return domain || undefined
}

export function safeEmailMeta(email: string): { emailHash: string; emailDomain?: string } {
  return {
    emailHash: hashForLog(email.trim().toLowerCase()),
    emailDomain: emailDomain(email),
  }
}
