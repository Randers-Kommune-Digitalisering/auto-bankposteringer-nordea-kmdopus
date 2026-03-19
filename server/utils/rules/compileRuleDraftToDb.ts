import type { RuleDraftSchema } from '~/lib/db/schema/rule'
import { mapMatchesToConditionRows } from '~/lib/db/schema/rule'

const version = 1

export function compileRuleDraftToDb(draft: RuleDraftSchema) {
  const {
    matches,
    relatedBankAccounts,
    ruleTags,
    accountingDimensions,
    accountingText,
    accountingCprType,
    accountingCprNumber,
    accountingNotifyTo,
    accountingNote,
    accountingAttachmentName,
    accountingAttachmentFileExtension,
    accountingAttachmentData,
    ...rest
  } = draft

  const conditionRows = mapMatchesToConditionRows(matches ?? [])
  const bankAccountIds = Array.from(new Set(relatedBankAccounts))
  const tagIds = Array.from(new Set(ruleTags ?? []))
  const ruleData = {
    ...rest,
    currentVersionId: version,
  }

  const attachments: Array<{ name: string; fileExtension: string; data: string }> = []
  const maxAttachments = Math.max(
    accountingAttachmentName?.length ?? 0,
    accountingAttachmentFileExtension?.length ?? 0,
    accountingAttachmentData?.length ?? 0,
  )

  for (let i = 0; i < maxAttachments; i++) {
    const name = accountingAttachmentName?.[i]
    const fileExtension = accountingAttachmentFileExtension?.[i]
    const data = accountingAttachmentData?.[i]

    if (name && fileExtension && data) {
      attachments.push({ name, fileExtension, data })
    }
  }

  const accountingParameters = {
    bookingText: accountingText,
    cprType: accountingCprType,
    cprNumber: accountingCprNumber,
    notifyTo: accountingNotifyTo?.length ? accountingNotifyTo : null,
    note: accountingNote,
  }

  return {
    ruleData,
    bankAccountIds,
    tagIds,
    conditionRows,
    accountingParameters,
    attachments,
    versionContent: {
      ...ruleData,
      relatedBankAccounts: bankAccountIds,
      ruleTags: tagIds,
      matches: matches ?? [],
      accounting: {
        ...accountingParameters,
        dimensions: accountingDimensions ?? [],
        attachments,
      },
    },
  }
}
