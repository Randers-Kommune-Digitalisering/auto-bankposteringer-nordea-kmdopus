export interface PostingAttachment {
  name: string
  type: string
  data: string
}

export interface PostingLineInput {
  /**
   * Internal linkage for audit/recovery.
   * Not part of the ERP payload; adapters should ignore unknown fields.
   */
  transactionId?: string
  amount: number | string
  debetOrCredit: 'Debet' | 'Kredit'
  dimensions: Record<string, string>
  text?: string
  cpr?: string
  attachmentName?: string
  attachmentType?: string
  attachmentData?: string
  attachments?: PostingAttachment[]
}
