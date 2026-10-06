import crypto from 'node:crypto'
import type { BuildErpRequestInput, ErpAdapter } from '../../../ports/erpAdapter'
import type { PostingLineInput } from '../../../../posting/domain/posting'
import { buildErpPostingXml, type BuildPostingXmlOptions } from './postingXmlBuilder'
import { parseKmdPostingResponse } from './kmdResponseParser'
import { ErpSftpClient, type RemoteFile } from './sftpClient'
import { logger } from '~/lib/logger'

export function createKmdErpAdapter(options: {
  sftpClient?: ErpSftpClient
  xmlOptions?: Partial<BuildPostingXmlOptions>
} = {}): ErpAdapter {
  const sftp = options.sftpClient ?? new ErpSftpClient()
  const log = logger.child({ scope: 'erp.kmdAdapter' })

  return {
    supplier: 'kmd',

    buildRequest(input: BuildErpRequestInput) {
      const xmlOptions: BuildPostingXmlOptions = {
        bookingDate: input.bookingDate,
        dimensionKeyByTarget: input.dimensionKeyByTarget,
        ...options.xmlOptions,
      }

      const xmlResult = buildErpPostingXml(input.postings, xmlOptions)
      const requestId = crypto.randomUUID()

      return {
        requestId,
        documentId: xmlResult.documentId,
        filename: xmlResult.filename,
        payload: xmlResult.payload,
        lineCount: xmlResult.lineCount,
      }
    },

    async uploadRequestPayload(input: { filename: string; content: string }) {
      log.info('ERP request upload (KMD) start', { filename: input.filename })
      const remotePath = await sftp.uploadFile({ filename: input.filename, content: input.content })
      log.info('ERP request upload (KMD) done', { filename: input.filename, remotePath })
      return { remotePath }
    },

    async ingestResponses(ingestOptions = {}) {
      log.info('ERP response ingest (KMD) start', {
        limit: ingestOptions.limit,
        deleteAfterPickup: ingestOptions.deleteAfterPickup ?? false,
      })
      const files = await sftp.fetchResponseFiles(ingestOptions.limit)

      const responses = files.map((file) => {
        const payload = file.contents.toString('utf-8')
        try {
          const parsed = parseKmdPostingResponse(payload)
          return {
            requestFilename: parsed.requestFilename,
            payload,
            remotePath: file.path,
            statusText: parsed.statusText,
            documents: parsed.documents.map(document => ({
              documentId: document.documentNumber,
              status: document.status,
              messages: document.messages,
            })),
          }
        } catch (error) {
          log.error('ERP response parse failed (KMD)', { filename: file.name, error })
          return {
            payload,
            remotePath: file.path,
            statusText: 'FEJL: KMD-svar kunne ikke fortolkes',
          }
        }
      })

      log.info('ERP response ingest (KMD) done', { files: files.length, deletedRemoteFiles: 0 })

      return { responses, deletedRemoteFiles: 0 }
    },

    async deleteResponseFile(remotePath: string) {
      await sftp.deleteRemoteFile(remotePath)
    },
  }
}

export function kmdErpAdapter(): ErpAdapter {
  return createKmdErpAdapter()
}
