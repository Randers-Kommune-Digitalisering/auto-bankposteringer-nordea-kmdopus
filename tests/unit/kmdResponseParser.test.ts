import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { XMLParser } from 'fast-xml-parser'
import { createKmdErpAdapter } from '../../engine/erp-integration/infrastructure/adapters/kmd/kmdErpAdapter'
import { parseKmdPostingResponse } from '../../engine/erp-integration/infrastructure/adapters/kmd/kmdResponseParser'
import { replaceKmdRequestFilename } from '../../engine/erp-integration/infrastructure/adapters/kmd/postingXmlBuilder'
import type { ErpSftpClient } from '../../engine/erp-integration/infrastructure/adapters/kmd/sftpClient'

const successXml = readFileSync(new URL('../../resources/erp/kmd/examples/FinancePostingResponseSucces.xml', import.meta.url), 'utf-8')
const mixedXml = readFileSync(new URL('../../resources/erp/kmd/examples/FinancePostingResponseError.xml', import.meta.url), 'utf-8')

describe('parseKmdPostingResponse', () => {
  it('parses a successful response with repeated RETURN elements', () => {
    const result = parseKmdPostingResponse(successXml)

    expect(result.status).toBe('success')
    expect(result.counts).toEqual({ received: 2, accepted: 2, rejected: 0 })
    expect(result.documents).toHaveLength(2)
    expect(result.documents.map(document => document.documentNumber)).toEqual(['10000000', '10000001'])
    expect(result.documents.every(document => document.status === 'accepted')).toBe(true)
  })

  it('reads the request transport filename from CONTROL_FIELDS', () => {
    const result = parseKmdPostingResponse(`
      <ns1:FinancePostingResponse xmlns:ns1="http://kmd.dk/fir/posting/external">
        <CONTROL_FIELDS><FILE_NAME>request-attempt.xml</FILE_NAME></CONTROL_FIELDS>
        <RETURN><RECEIV_DOC>document-1</RECEIV_DOC><MESSAGE_TYPE>I</MESSAGE_TYPE><MESSAGE_NUM>305</MESSAGE_NUM><MESSAGE_TEXT>Accepted</MESSAGE_TEXT></RETURN>
      </ns1:FinancePostingResponse>`)

    expect(result.requestFilename).toBe('request-attempt.xml')
  })

  it('preserves mixed per-document outcomes while reporting an aggregate partial failure', () => {
    const result = parseKmdPostingResponse(mixedXml)

    expect(result.status).toBe('partial')
    expect(result.counts).toEqual({ received: 2, accepted: 1, rejected: 1 })
    expect(result.documents.map(document => [document.documentNumber, document.status])).toEqual([
      ['10000000', 'accepted'],
      ['10000001', 'rejected'],
    ])
    expect(result.documents[1]?.messages[0]?.text).toContain('tidligere modtaget')
  })

  it('uses file-level counts when the response omits per-document results', () => {
    const result = parseKmdPostingResponse(`
      <FinancePostingResponse>
        <RETURN><RECEIV_DOC/><MESSAGE_TYPE>I</MESSAGE_TYPE><MESSAGE_NUM>201</MESSAGE_NUM><MESSAGE_TEXT>Antal modtagne bilag: 0002</MESSAGE_TEXT></RETURN>
        <RETURN><RECEIV_DOC/><MESSAGE_TYPE>I</MESSAGE_TYPE><MESSAGE_NUM>202</MESSAGE_NUM><MESSAGE_TEXT>Antal godkendte bilag: 0002</MESSAGE_TEXT></RETURN>
      </FinancePostingResponse>`)

    expect(result.status).toBe('success')
    expect(result.counts).toEqual({ received: 2, accepted: 2, rejected: 0 })
  })

  it('rejects malformed or unrelated XML instead of reporting success', () => {
    expect(() => parseKmdPostingResponse('<FinancePostingResponse>')).toThrow(/Invalid KMD posting response XML/)
    expect(() => parseKmdPostingResponse('<OtherResponse><RETURN /></OtherResponse>')).toThrow(/missing FinancePostingResponse/)
  })

  it('keeps malformed response payloads but marks them as errors during SFTP ingestion', async () => {
    const adapter = createKmdErpAdapter({
      sftpClient: {
        fetchResponseFiles: async () => [{
          path: '/response/broken.xml',
          name: 'broken.xml',
          size: 28,
          contents: Buffer.from('<FinancePostingResponse>'),
        }],
      } as unknown as ErpSftpClient,
    })

    const result = await adapter.ingestResponses()

    expect(result.responses[0]?.payload).toBe('<FinancePostingResponse>')
    expect(result.responses[0]?.statusText).toBe('FEJL: KMD-svar kunne ikke fortolkes')
  })

  it('correlates by the embedded request filename and defers remote deletion', async () => {
    const deleteRemoteFile = vi.fn(async () => undefined)
    const adapter = createKmdErpAdapter({
      sftpClient: {
        fetchResponseFiles: async () => [{
          path: '/response/response.xml',
          name: 'response.xml',
          size: 256,
          contents: Buffer.from(`
            <FinancePostingResponse>
              <CONTROL_FIELDS><FILE_NAME>request-attempt.xml</FILE_NAME></CONTROL_FIELDS>
              <RETURN><RECEIV_DOC>document-1</RECEIV_DOC><MESSAGE_TYPE>E</MESSAGE_TYPE><MESSAGE_NUM>301</MESSAGE_NUM><MESSAGE_TEXT>Duplicate</MESSAGE_TEXT></RETURN>
            </FinancePostingResponse>`),
        }],
        deleteRemoteFile,
      } as unknown as ErpSftpClient,
    })

    const result = await adapter.ingestResponses({ deleteAfterPickup: true })

    expect(result.responses[0]?.requestFilename).toBe('request-attempt.xml')
    expect(result.responses[0]?.remotePath).toBe('/response/response.xml')
    expect(result.responses[0]?.documents?.[0]?.documentId).toBe('document-1')
    expect(deleteRemoteFile).not.toHaveBeenCalled()
    await adapter.deleteResponseFile?.('/response/response.xml')
    expect(deleteRemoteFile).toHaveBeenCalledWith('/response/response.xml')
  })
})

describe('replaceKmdRequestFilename', () => {
  it('changes the transport filename while preserving the outbound document ID', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <n1:FinancePostingRequest xmlns:n1="http://kmd.dk/fir/posting/external">
        <CONTROL_FIELDS><FILE_NAME>original.xml</FILE_NAME></CONTROL_FIELDS>
        <POSTING_DOCUMENT><HEADER><RECEIV_DOC>stable-document-id</RECEIV_DOC></HEADER></POSTING_DOCUMENT>
      </n1:FinancePostingRequest>`

    const result = await replaceKmdRequestFilename(xml, 'retry.xml')
    const parsed = new XMLParser({ ignoreAttributes: true, removeNSPrefix: true }).parse(result.payload)

    expect(result.documentId).toBe('stable-document-id')
    expect(parsed.FinancePostingRequest.CONTROL_FIELDS.FILE_NAME).toBe('retry.xml')
    expect(parsed.FinancePostingRequest.POSTING_DOCUMENT.HEADER.RECEIV_DOC).toBe('stable-document-id')
  })
})