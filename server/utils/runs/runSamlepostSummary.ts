import { toSamlepostId, toStatementEntryKey, type SamlepostIdentityInput } from '../iso20022Samlepost'

export type RunSamlepostRow = SamlepostIdentityInput & {
  statementId: string | null
  entryIndex: number | null
  processingStatus: string | null
  processingSource: string | null
}

export type RunSamlepostSummary = {
  totalSamleposter: number
  processedSamleposter: number
  bookedSamleposter: number
  exceptedSamleposter: number
  openSamleposter: number
  mixedSamleposter: number
  manualBookedSamleposter: number
}

export function summarizeRunSamleposter(rows: RunSamlepostRow[]): RunSamlepostSummary {
  const entryGroupSizes = new Map<string, number>()
  for (const row of rows) {
    const entryKey = toStatementEntryKey(row.statementId, row.entryIndex)
    if (entryKey) entryGroupSizes.set(entryKey, (entryGroupSizes.get(entryKey) ?? 0) + 1)
  }

  const groups = new Map<string, RunSamlepostRow[]>()
  for (const row of rows) {
    const entryKey = toStatementEntryKey(row.statementId, row.entryIndex)
    const groupId = toSamlepostId({
      ...row,
      entryGroupSize: entryKey ? entryGroupSizes.get(entryKey) ?? 0 : 0,
    })
    const group = groups.get(groupId) ?? []
    group.push(row)
    groups.set(groupId, group)
  }

  let processedSamleposter = 0
  let bookedSamleposter = 0
  let exceptedSamleposter = 0
  let openSamleposter = 0
  let mixedSamleposter = 0
  let manualBookedSamleposter = 0
  for (const group of groups.values()) {
    const statuses = group.map(row => row.processingStatus)
    if (statuses.every(status => status != null)) processedSamleposter += 1
    if (statuses.some(status => status == null || status === 'åben')) openSamleposter += 1
    if (statuses.every(status => status === 'bogført')) bookedSamleposter += 1
    if (statuses.every(status => status === 'undtaget')) exceptedSamleposter += 1
    if (statuses.every(status => status != null && status !== 'åben')
      && new Set(statuses).size > 1) {
      mixedSamleposter += 1
    }
    if (group.some(row => row.processingStatus === 'bogført' && row.processingSource === 'manuel')) {
      manualBookedSamleposter += 1
    }
  }

  return {
    totalSamleposter: groups.size,
    processedSamleposter,
    bookedSamleposter,
    exceptedSamleposter,
    openSamleposter,
    mixedSamleposter,
    manualBookedSamleposter,
  }
}