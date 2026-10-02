import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createKmdErpAdapter } from '../../engine/erp-integration/infrastructure/adapters/kmd/kmdErpAdapter'
import { parseKmdPostingResponse } from '../../engine/erp-integration/infrastructure/adapters/kmd/kmdResponseParser'
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
})