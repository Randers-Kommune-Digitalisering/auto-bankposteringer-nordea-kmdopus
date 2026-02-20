import type { PostingAttachment, PostingLineInput } from "../erp/postingXmlBuilder";
import { submitErpPosting } from "../erp/erpPostingService";
import { buildPostingLines, type PostingTransactionContext } from "../matching/postingUtils";

export type PostingCommandDefinition = {
  transaction: PostingTransactionContext;
  landingAccount: string;
  landingSecondary?: string;
  landingTertiary?: string;
  text: string;
  cpr?: string;
  attachments?: PostingAttachment[];
};

export type PostingCommand = PostingCommandDefinition & {
  postings: PostingLineInput[];
};

export function buildPostingCommand(definition: PostingCommandDefinition): PostingCommand {
  return {
    ...definition,
    postings: buildPostingLines(definition),
  };
}

export type PostingExecutionOptions = {
  runId: string;
  bookingDate: Date;
};

export type PostingExecutionResult = Awaited<ReturnType<typeof submitErpPosting>>;

export async function executePostingCommand(
  command: PostingCommand,
  options: PostingExecutionOptions,
): Promise<PostingExecutionResult> {
  return submitErpPosting({
    runId: options.runId,
    bookingDate: options.bookingDate,
    postings: command.postings,
  });
}
