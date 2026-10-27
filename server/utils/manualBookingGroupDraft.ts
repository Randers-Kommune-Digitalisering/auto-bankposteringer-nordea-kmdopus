import { createHash } from 'node:crypto'

export function manualBookingGroupDraftMemberSignature(transactionIds: string[]): string {
  const memberIds = [...new Set(transactionIds)].sort()
  return createHash('sha256').update(`v1\n${memberIds.join('\n')}`).digest('hex')
}
