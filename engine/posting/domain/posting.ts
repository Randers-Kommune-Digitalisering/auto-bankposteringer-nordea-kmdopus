export interface PostingAttachment {
  name: string
  type: string
  data: string
}

export interface PostingLineInput {
  amount: number | string
  debetOrCredit: 'Debet' | 'Kredit'
  account: string
  accountSecondary?: string
  accountTertiary?: string
  text?: string
  cpr?: string
  attachmentName?: string
  attachmentType?: string
  attachmentData?: string
  attachments?: PostingAttachment[]
}
