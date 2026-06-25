import { XMLParser } from 'fast-xml-parser'
import {
  parseNordeaAdditionalEntryInfo,
  findNordeaAdditionalEntryInfoValueByCode,
  type NordeaAdditionalEntryInfoSegment,
} from './nordeaAdditionalEntryInfo'

export type Camt053ParsedDocument = {
  messageId: string | null
  createdAt: Date | null
  statements: Camt053ParsedStatement[]
}

export type Camt053ParsedStatement = {
  statementId: string
  electronicSeqNo: number | null
  legalSeqNo: number | null
  statementCreatedAt: Date | null
  iban: string | null
  currency: string | null
  ownerName: string | null
  servicerBic: string | null
  fromDate: Date | null
  toDate: Date | null
  balances: Camt053ParsedBalance[]
  transactions: Camt053ParsedTransaction[]
}

export type Camt053ParsedBalance = {
  typeCode: string
  amount: string
  currency: string | null
  creditDebitIndicator: string | null
  balanceDate: Date | null
}

export type Camt053ParsedTransaction = {
  entryIndex: number
  entrySubIndex: number
  amount: string
  currency: string | null
  creditDebitIndicator: string | null
  status: string | null
  bookingDate: Date
  valueDate: Date | null

  ntryRef: string | null
  ntryAcctSvcrRef: string | null
  entryAdditionalInfo: string | null
  entryAdditionalInfoSegments: NordeaAdditionalEntryInfoSegment[]

  txAcctSvcrRef: string | null
  refsEndToEndId: string | null
  refsInstrId: string | null
  refsPmtInfId: string | null
  uetr: string | null
  txAdditionalInfo: string | null

  bkTxCdDomain: string | null
  bkTxCdFamily: string | null
  bkTxCdSubFamily: string | null
  bkTxCdProprietary: string | null

  debtorName: string | null
  debtorId: string | null
  debtorAccountIban: string | null
  creditorName: string | null
  creditorId: string | null
  creditorAccountIban: string | null
  ultimateDebtorName: string | null
  ultimateCreditorName: string | null

  remittanceUstrd: string[]
  remittanceCreditorReference: string | null
  remittanceAdditional: string[]
}

export function parseCamt053Xml(xml: string): Camt053ParsedDocument {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    removeNSPrefix: true,
    trimValues: false,

    // Keep CAMT values as strings (avoid 100.00 -> 100)
    parseTagValue: false,
    parseAttributeValue: false,
  })

  const parsed = parser.parse(xml)
  const bkToCstmrStmt = (parsed as any)?.Document?.BkToCstmrStmt
  const grpHdr = bkToCstmrStmt?.GrpHdr

  const messageId = asTrimmedString(grpHdr?.MsgId)
  const createdAt = parseDateTime(grpHdr?.CreDtTm)

  const stmts = asArray<any>(bkToCstmrStmt?.Stmt)

  const statements: Camt053ParsedStatement[] = []

  for (const stmt of stmts) {
    const statementId = asTrimmedString(stmt?.Id)
    if (!statementId) continue

    const acct = stmt?.Acct
    const iban = asTrimmedString(acct?.Id?.IBAN)
    const currency = asTrimmedString(acct?.Ccy)
    const ownerName = asTrimmedString(acct?.Ownr?.Nm)
    const servicerBic = asTrimmedString(acct?.Svcr?.FinInstnId?.BIC)

    const balances: Camt053ParsedBalance[] = []
    for (const bal of asArray<any>(stmt?.Bal)) {
      const typeCode = asTrimmedString(bal?.Tp?.CdOrPrtry?.Cd)
      if (!typeCode) continue

      const amt = bal?.Amt
      const amount = asAmountValue(amt)
      if (!amount) continue

      balances.push({
        typeCode,
        amount,
        currency: asAmountCurrency(amt) ?? null,
        creditDebitIndicator: asTrimmedString(bal?.CdtDbtInd),
        balanceDate: parseDateOnly(bal?.Dt?.Dt ?? bal?.Dt),
      })
    }

    const transactions: Camt053ParsedTransaction[] = []

    const entries = asArray<any>(stmt?.Ntry)
    for (const [entryIndexZero, entry] of entries.entries()) {
      const entryIndex = entryIndexZero + 1

      const entryAmtNode = entry?.Amt
      const entryAmount = asAmountValue(entryAmtNode)
      if (!entryAmount) continue

      const entryCurrency = asAmountCurrency(entryAmtNode) ?? currency ?? null
      const creditDebitIndicator = asTrimmedString(entry?.CdtDbtInd)

      const bookingDate = parseDateOnly(entry?.BookgDt?.Dt ?? entry?.BookgDt)
      if (!bookingDate) continue

      const valueDate = parseDateOnly(entry?.ValDt?.Dt ?? entry?.ValDt)

      const entryDomain = asTrimmedString(entry?.BkTxCd?.Domn?.Cd)
      const entryFamily = asTrimmedString(entry?.BkTxCd?.Domn?.Fmly?.Cd)
      const entrySubFamily = asTrimmedString(entry?.BkTxCd?.Domn?.Fmly?.SubFmlyCd)

      const entryDetails = asArray<any>(entry?.NtryDtls)
      const txDetails = entryDetails.flatMap((detail) => asArray<any>(detail?.TxDtls))
      const rows = txDetails.length ? txDetails : [null]

      for (const [txIndexZero, tx] of rows.entries()) {
        const entrySubIndex = txIndexZero + 1
        const txRefs = tx?.Refs
        const txRmtInf = tx?.RmtInf
        const txRltdPties = tx?.RltdPties

        const txBkTxCd = tx?.BkTxCd
        const txDomain = asTrimmedString(txBkTxCd?.Domn?.Cd) ?? entryDomain
        const txFamily = asTrimmedString(txBkTxCd?.Domn?.Fmly?.Cd) ?? entryFamily
        const txSubFamily = asTrimmedString(txBkTxCd?.Domn?.Fmly?.SubFmlyCd) ?? entrySubFamily

        const remittanceUstrd = normalizeStringArray(txRmtInf?.Ustrd)
        const structuredCreditorRef = asTrimmedString(txRmtInf?.Strd?.CdtrRefInf?.Ref)
        const additionalRemittance = normalizeStringArray(txRmtInf?.AddtlRmtInf)

        const debtor = txRltdPties?.Dbtr
        const debtorAcct = txRltdPties?.DbtrAcct
        const creditor = txRltdPties?.Cdtr
        const creditorAcct = txRltdPties?.CdtrAcct
        const ultimateDebtor = txRltdPties?.UltmtDbtr
        const ultimateCreditor = txRltdPties?.UltmtCdtr

        const debtorName = extractPartyDisplayName(debtor)
        const debtorId = extractPartyId(debtor)
        const debtorAccountIban = asTrimmedString(debtorAcct?.Id?.IBAN)

        const entryAdditionalInfo = asTrimmedString(entry?.AddtlNtryInf)
        const entryAdditionalInfoSegments = parseNordeaAdditionalEntryInfo(entryAdditionalInfo)
        const creditorFromAdditionalEntryInfo = findNordeaAdditionalEntryInfoValueByCode(entryAdditionalInfoSegments, '510')

        const creditorName = extractPartyDisplayName(creditor) ?? creditorFromAdditionalEntryInfo
        const creditorId = extractPartyId(creditor)
        const creditorAccountIban = asTrimmedString(creditorAcct?.Id?.IBAN)

        const ultimateDebtorName = extractPartyDisplayName(ultimateDebtor)
        const ultimateCreditorName = extractPartyDisplayName(ultimateCreditor)

        const txAmtNode = tx?.AmtDtls?.TxAmt?.Amt
        const txAmount = asAmountValue(txAmtNode) ?? entryAmount
        const txCurrency = asAmountCurrency(txAmtNode) ?? entryCurrency

        transactions.push({
          entryIndex,
          entrySubIndex,
          amount: txAmount,
          currency: txCurrency,
          creditDebitIndicator,
          status: asTrimmedString(entry?.Sts),
          bookingDate,
          valueDate,
          ntryRef: asTrimmedString(entry?.NtryRef),
          ntryAcctSvcrRef: asTrimmedString(entry?.AcctSvcrRef),
          entryAdditionalInfo,
          entryAdditionalInfoSegments,
          txAcctSvcrRef: asTrimmedString(txRefs?.AcctSvcrRef),
          refsEndToEndId: asTrimmedString(txRefs?.EndToEndId),
          refsInstrId: asTrimmedString(txRefs?.InstrId),
          refsPmtInfId: asTrimmedString(txRefs?.PmtInfId),
          uetr: asTrimmedString(txRefs?.UETR),
          txAdditionalInfo: asTrimmedString(tx?.AddtlTxInf),
          bkTxCdDomain: txDomain ?? null,
          bkTxCdFamily: txFamily ?? null,
          bkTxCdSubFamily: txSubFamily ?? null,
          bkTxCdProprietary: asTrimmedString(txBkTxCd?.Prtry?.Cd),
          debtorName,
          debtorId,
          debtorAccountIban,
          creditorName,
          creditorId,
          creditorAccountIban,
          ultimateDebtorName,
          ultimateCreditorName,
          remittanceUstrd,
          remittanceCreditorReference: structuredCreditorRef,
          remittanceAdditional: additionalRemittance,
        })
      }
    }

    statements.push({
      statementId,
      electronicSeqNo: parseIntOrNull(stmt?.ElctrncSeqNb),
      legalSeqNo: parseIntOrNull(stmt?.LglSeqNb),
      statementCreatedAt: parseDateTime(stmt?.CreDtTm),
      iban,
      currency,
      ownerName,
      servicerBic,
      fromDate: parseDateOnly(stmt?.FrToDt?.FrDtTm ?? stmt?.FrToDt?.FrDt),
      toDate: parseDateOnly(stmt?.FrToDt?.ToDtTm ?? stmt?.FrToDt?.ToDt),
      balances,
      transactions,
    })
  }

  return {
    messageId,
    createdAt,
    statements,
  }
}

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function asTrimmedString(value: unknown): string | null {
  if (value == null) return null

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const trimmed = String(value).trim()
    return trimmed.length ? trimmed : null
  }

  if (value && typeof value === 'object' && '#text' in (value as any)) {
    return asTrimmedString((value as any)['#text'])
  }

  return null
}

function normalizeStringArray(value: unknown): string[] {
  const raw = asArray<any>(value as any)
  return raw
    .map((entry) => asTrimmedString(entry))
    .filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
}

function parseDateOnly(value: unknown): Date | null {
  const text = asTrimmedString(value)
  if (!text) return null

  const match = /^\d{4}-\d{2}-\d{2}$/.exec(text)
  if (!match) return null

  const parsed = new Date(`${text}T00:00:00.000Z`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function parseDateTime(value: unknown): Date | null {
  const text = asTrimmedString(value)
  if (!text) return null
  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function parseIntOrNull(value: unknown): number | null {
  const text = asTrimmedString(value)
  if (!text) return null
  const parsed = Number.parseInt(text, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function asAmountValue(amtNode: any): string | null {
  if (!amtNode) return null

  if (typeof amtNode === 'string' || typeof amtNode === 'number') {
    const trimmed = String(amtNode).trim()
    return trimmed.length ? trimmed : null
  }

  if (typeof amtNode === 'object') {
    const value = asTrimmedString(amtNode['#text'])
    return value
  }

  return null
}

function asAmountCurrency(amtNode: any): string | null {
  if (!amtNode || typeof amtNode !== 'object') return null
  const currency = amtNode?.['@_Ccy']
  return asTrimmedString(currency)
}

function extractPartyId(party: any): string | null {
  if (!party || typeof party !== 'object') return null

  const candidates = [
    party?.Id?.OrgId?.Othr?.Id,
    party?.Id?.OrgId?.AnyBIC,
    party?.Id?.PrvtId?.Othr?.Id,
    party?.Id?.PrvtId?.Othr?.SchmeNm?.Prtry,
  ]

  for (const candidate of candidates) {
    const asText = asTrimmedString(candidate)
    if (asText) return asText
  }

  return null
}

function extractPartyDisplayName(party: any): string | null {
  if (!party || typeof party !== 'object') return null

  const adrLines = normalizeStringArray(party?.PstlAdr?.AdrLine)
  const preferredAdrLine = pickPreferredPartyAdrLine(adrLines)
  if (preferredAdrLine) {
    return preferredAdrLine
  }

  const directName = asTrimmedString(party?.Nm)
  if (directName) return directName

  return null
}

function pickPreferredPartyAdrLine(lines: string[]): string | null {
  if (!Array.isArray(lines) || lines.length === 0) return null

  const normalized = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (normalized.length === 0) return null

  const bestNameLike = normalized.find((line) => !isLikelyHonorific(line) && !isLikelyAddressLine(line))
  if (bestNameLike) return bestNameLike

  const fallbackNonAddress = normalized.find((line) => !isLikelyAddressLine(line))
  if (fallbackNonAddress) return fallbackNonAddress

  return normalized[0] ?? null
}

function isLikelyHonorific(line: string): boolean {
  return /^(hr|fru|mr|mrs|ms|dr)\.?$/i.test(line.trim())
}

function isLikelyAddressLine(line: string): boolean {
  const value = line.trim()
  if (!value) return false

  // Postal codes, house numbers, or floor/door markers are usually address fragments.
  if (/\b\d{4}\b/.test(value)) return true
  if (/\d/.test(value) && /\b(st|th|tv|mf|sal)\b/i.test(value)) return true

  const upper = value.toUpperCase()
  return /(VEJ|GADE|STI|STIEN|ALLE|ALL[EÉ]|TORV|PLADS|PARK|BOULEVARD|V[ÆA]NGE|MARKEN|BAKKEN|TOFTEN)\b/.test(upper)
}
