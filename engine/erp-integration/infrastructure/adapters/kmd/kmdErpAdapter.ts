import type { BuildErpRequestInput, ErpAdapter } from '../../../ports/erpAdapter'
import type { PostingLineInput } from '../../../../posting/domain/posting'
import { buildErpPostingXml, type BuildPostingXmlOptions } from './postingXmlBuilder'
import { ErpSftpClient, type RemoteFile } from './sftpClient'

function tryResolveRequestIdFromFilename(file: RemoteFile): string | undefined {
  const name = file.name.trim()
  if (!name) return undefined

  // KMD Opus: we use the generated filename as requestId
  return name
}

export function createKmdErpAdapter(options: {
  sftpClient?: ErpSftpClient
  resolveRequestId?: (file: RemoteFile) => string | undefined
  xmlOptions?: Partial<BuildPostingXmlOptions>
} = {}): ErpAdapter {
  const sftp = options.sftpClient ?? new ErpSftpClient()

  return {
    supplier: 'kmd',

    buildRequest(input: BuildErpRequestInput) {
      const xmlOptions: BuildPostingXmlOptions = {
        bookingDate: input.bookingDate,
        runUid: input.runId,
        dimensionKeyByTarget: input.dimensionKeyByTarget,
        ...options.xmlOptions,
      }

      const xmlResult = buildErpPostingXml(input.postings, xmlOptions)
      const requestId = xmlResult.filename

      return {
        requestId,
        filename: xmlResult.filename,
        payload: xmlResult.payload,
        lineCount: xmlResult.lineCount,
      }
    },

    async uploadRequestPayload(input: { filename: string; content: string }) {
      const remotePath = await sftp.uploadFile({ filename: input.filename, content: input.content })
      return { remotePath }
    },

    async ingestResponses(ingestOptions = {}) {
      const files = await sftp.fetchResponseFiles(ingestOptions.limit)
      let deleted = 0

      const resolveRequestId =
        options.resolveRequestId ??
        ((file: RemoteFile) => tryResolveRequestIdFromFilename(file))

      const responses = files.map(file => ({
        requestId: resolveRequestId(file),
        payload: file.contents.toString('utf-8'),
        remotePath: file.path,
      }))

      if (ingestOptions.deleteAfterPickup ?? true) {
        for (const file of files) {
          await sftp.deleteRemoteFile(file.path)
          deleted += 1
        }
      }

      return { responses, deletedRemoteFiles: deleted }
    },
  }
}

export function kmdErpAdapter(): ErpAdapter {
  return createKmdErpAdapter()
}
