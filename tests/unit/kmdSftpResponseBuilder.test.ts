import { describe, expect, it } from 'vitest'
import { parseKmdPostingResponse } from '../../engine/erp-integration/infrastructure/adapters/kmd/kmdResponseParser'
import { buildKmdSftpResponse } from '../../scripts/dev/kmdSftpResponseBuilder'

function requestXml(documentNumbers: string[]): string {
  const postingDocuments = documentNumbers.map(documentNumber => `
    <POSTING_DOCUMENT>
      <HEADER><RECEIV_DOC>${documentNumber}</RECEIV_DOC><PSTNG_DATE>20260929</PSTNG_DATE><COMP_CODE>0020</COMP_CODE></HEADER>
      <LINES><LINE><GL_ACCOUNT>1000</GL_ACCOUNT></LINE></LINES>
    </POSTING_DOCUMENT>`).join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
  <n1:FinancePostingRequest xmlns:n1="http://kmd.dk/fir/posting/external">
    <CONTROL_FIELDS><SENDERID>T02CLNT797</SENDERID><RECEIVER>T02CLNT797</RECEIVER><FILE_NAME>request.xml</FILE_NAME><SEND_DATE>20260929</SEND_DATE><SEND_TIME>143000</SEND_TIME></CONTROL_FIELDS>
    ${postingDocuments}
  </n1:FinancePostingRequest>`
}

describe('buildKmdSftpResponse', () => {
  it('builds a success response from the uploaded request document', () => {
    const generated = buildKmdSftpResponse(requestXml(['run-document-1']), 'fallback.xml', 'success')
    const parsed = parseKmdPostingResponse(generated.xml)

    expect(generated.filename).toBe('request.xml')
    expect(parsed.status).toBe('success')
    expect(parsed.documents[0]?.documentNumber).toBe('run-document-1')
    expect(parsed.counts).toEqual({ received: 1, accepted: 1, rejected: 0 })
  })

  it('builds a rejection and a mixed response from multiple actual request documents', () => {
    const request = requestXml(['voucher-a', 'voucher-b'])
    const failed = parseKmdPostingResponse(buildKmdSftpResponse(request, 'fallback.xml', 'error').xml)
    const mixed = parseKmdPostingResponse(buildKmdSftpResponse(request, 'fallback.xml', 'mixed', () => 0).xml)

    expect(failed.status).toBe('error')
    expect(failed.documents.every(document => document.status === 'rejected')).toBe(true)
    expect(mixed.status).toBe('partial')
    expect(mixed.documents.map(document => document.documentNumber)).toEqual(['voucher-a', 'voucher-b'])
    expect(mixed.counts).toEqual({ received: 2, accepted: 1, rejected: 1 })
  })
})