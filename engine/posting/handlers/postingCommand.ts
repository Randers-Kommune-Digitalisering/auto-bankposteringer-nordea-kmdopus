import type { PostingAttachment, PostingLineInput } from '../domain/posting'
import { submitErpPostingViaOutbox } from '../../erp-integration/infrastructure/erpOutbox'
import { buildPostingLines, type PostingTransactionContext } from '../../matching/domain/postingUtils'

export type PostingCommandDefinition = {
  transaction: PostingTransactionContext
  landingAccount: string
  landingSecondary?: string
  landingTertiary?: string
  text: string
  cpr?: string
  attachments?: PostingAttachment[]
}

export type PostingCommand = PostingCommandDefinition & {
  postings: PostingLineInput[]
}

export function buildPostingCommand(definition: PostingCommandDefinition): PostingCommand {
  return {
    ...definition,
    postings: buildPostingLines(definition),
  }
}

export type PostingExecutionOptions = {
  runId: string
  bookingDate: Date
  erpSupplier?: string
}

export type PostingExecutionResult = Awaited<ReturnType<typeof submitErpPostingViaOutbox>>

export async function executePostingCommand(
  command: PostingCommand,
  options: PostingExecutionOptions,
): Promise<PostingExecutionResult> {
  return submitErpPostingViaOutbox({
    runId: options.runId,
    bookingDate: options.bookingDate,
    postings: command.postings,
    erpSupplier: options.erpSupplier,
  })
}
