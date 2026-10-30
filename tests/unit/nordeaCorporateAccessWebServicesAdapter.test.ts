import { afterEach, describe, expect, it, vi } from 'vitest'
import * as nordeaWsClient from '../../engine/banking-ingestion/infrastructure/nordea/nordeaCorporateAccessWsClient'
import { NordeaCorporateAccessWebServicesAdapter } from '../../engine/banking-ingestion/infrastructure/nordea/nordeaCorporateAccessWebServicesAdapter'

function createAdapter() {
  return new NordeaCorporateAccessWebServicesAdapter({
    endpointUrl: 'https://example.test/soap',
    senderId: 'sender',
    receiverId: 'Nordea',
    userAgent: 'unit-test',
    language: 'EN',
    customerId: 'customer',
    signerId: 'signer',
    softwareId: 'unit-test',
    environment: 'PRODUCTION',
    statementFileType: 'NDAREXXMLO',
    downloadStatus: 'ALL',
    lookbackDays: 7,
    maxFilesPerRun: 25,
    requestCompressed: true,
    applicationRequestPrivateKeyPem: 'private-key',
    applicationRequestCertificatePem: 'certificate',
    timeoutMs: 1_000,
  })
}

const requestInput = {
  accountId: 'provider:nordea',
  cursor: null,
  limit: 25,
  bookingDate: '2026-10-25',
}

describe('Nordea Corporate Access Web Services adapter', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns no documents when Nordea reports content not found', async () => {
    vi.spyOn(nordeaWsClient, 'nordeaDownloadFileList').mockRejectedValue(
      new nordeaWsClient.NordeaResponseHeaderError('24', 'Content not found.'),
    )
    const result = await createAdapter().fetchDocuments(requestInput)

    expect(result.documents).toEqual([])
    expect(result.nextCursor).toBeDefined()
  })

  it('continues to throw for other Nordea response errors', async () => {
    vi.spyOn(nordeaWsClient, 'nordeaDownloadFileList').mockRejectedValue(
      new nordeaWsClient.NordeaResponseHeaderError('12', 'Invalid request.'),
    )

    await expect(createAdapter().fetchDocuments(requestInput))
      .rejects.toThrow('Nordea ResponseHeader 12: Invalid request.')
  })
})
