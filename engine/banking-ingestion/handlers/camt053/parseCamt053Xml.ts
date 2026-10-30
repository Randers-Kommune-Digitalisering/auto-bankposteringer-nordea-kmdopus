import { XMLParser } from 'fast-xml-parser'
import {
  parseNordeaAdditionalEntryInfo,
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
  underlyingTransactionCount: number
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
  bkTxCdDomain: string | null
  bkTxCdFamily: string | null
  bkTxCdSubFamily: string | null
  bkTxCdProprietary: string | null
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
      const entryAdditionalInfo = asTrimmedString(entry?.AddtlNtryInf)

      transactions.push({
        entryIndex,
        underlyingTransactionCount: txDetails.length,
        amount: entryAmount,
        currency: entryCurrency,
        creditDebitIndicator,
        status: asTrimmedString(entry?.Sts),
        bookingDate,
        valueDate,
        ntryRef: asTrimmedString(entry?.NtryRef),
        ntryAcctSvcrRef: asTrimmedString(entry?.AcctSvcrRef),
        entryAdditionalInfo,
        entryAdditionalInfoSegments: parseNordeaAdditionalEntryInfo(entryAdditionalInfo),
        bkTxCdDomain: entryDomain,
        bkTxCdFamily: entryFamily,
        bkTxCdSubFamily: entrySubFamily,
        bkTxCdProprietary: asTrimmedString(entry?.BkTxCd?.Prtry?.Cd),
      })
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
