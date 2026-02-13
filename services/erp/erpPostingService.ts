import crypto from "node:crypto";
import db from "../../app/lib/db";
import { erpRequest, erpResponse } from '../../app/lib/db/schema/index'
import type { PostingLineInput, BuildPostingXmlOptions } from "./postingXmlBuilder";
import { buildErpPostingXml } from "./postingXmlBuilder";
import { ErpSftpClient, type RemoteFile } from "./sftpClient";

interface SubmitErpPostingInput {
  runId: string;
  postings: PostingLineInput[];
  bookingDate: Date | string;
  xmlOptions?: Partial<BuildPostingXmlOptions>;
  sftpClient?: ErpSftpClient;
}

interface SubmitErpPostingResult {
  requestId: string;
  filename: string;
  remotePath: string;
  lineCount: number;
}

export async function submitErpPosting(input: SubmitErpPostingInput): Promise<SubmitErpPostingResult> {
  const xmlOptions: BuildPostingXmlOptions = {
    bookingDate: input.bookingDate,
    runUid: input.runId,
    ...input.xmlOptions,
  };

  const xmlResult = buildErpPostingXml(input.postings, xmlOptions);
  const requestId = xmlResult.filename;

  await db.insert(erpRequest).values({
    id: requestId,
    runId: input.runId,
    payload: xmlResult.payload,
  });

  const client = input.sftpClient ?? new ErpSftpClient();
  const remotePath = await client.uploadFile({ filename: xmlResult.filename, content: xmlResult.payload });

  return {
    requestId,
    filename: xmlResult.filename,
    remotePath,
    lineCount: xmlResult.lineCount,
  };
}

interface IngestErpResponsesOptions {
  limit?: number;
  deleteAfterPickup?: boolean;
  sftpClient?: ErpSftpClient;
  resolveRequestId?: (file: RemoteFile) => string | undefined;
}

interface IngestErpResponsesResult {
  savedResponses: number;
  deletedRemoteFiles: number;
}

export async function ingestErpResponses(options: IngestErpResponsesOptions = {}): Promise<IngestErpResponsesResult> {
  const client = options.sftpClient ?? new ErpSftpClient();
  const files = await client.fetchResponseFiles(options.limit);
  let deleted = 0;

  for (const file of files) {
    const payload = file.contents.toString("utf-8");
    const requestId = options.resolveRequestId?.(file);

    await db.insert(erpResponse).values({
      id: crypto.randomUUID(),
      requestId,
      payload,
    });

    if (options.deleteAfterPickup ?? true) {
      await client.deleteRemoteFile(file.path);
      deleted += 1;
    }
  }

  return {
    savedResponses: files.length,
    deletedRemoteFiles: deleted,
  };
}
