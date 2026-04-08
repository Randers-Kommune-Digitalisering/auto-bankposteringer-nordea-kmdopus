import crypto from 'node:crypto'
import { XMLBuilder } from 'fast-xml-parser'

type DateOnly = string // YYYY-MM-DD

function asDateOnly(value: unknown): DateOnly | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null
  return trimmed
}

function dateToDateOnlyUtc(d: Date): DateOnly {
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function asString(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') {
    const t = value.trim()
    return t.length ? t : null
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return null
}

function pick(...values: unknown[]): string | null {
  for (const v of values) {
    const s = asString(v)
    if (s) return s
  }
  return null
}

function stableJsonStringify(value: unknown): string {
  if (value === undefined) return 'null'
  if (value == null) return 'null'
  if (typeof value !== 'object') return JSON.stringify(value) ?? 'null'
  if (Array.isArray(value)) return `[${value.map((v) => stableJsonStringify(v)).join(',')}]`

  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
  const entries = keys.map((k) => `${JSON.stringify(k)}:${stableJsonStringify(obj[k])}`)
  return `{${entries.join(',')}}`
}

function sha256Hex(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex')
}

function normalizeCreditDebitIndicator(value: unknown): 'CRDT' | 'DBIT' | null {
  const raw = asString(value)
  if (!raw) return null
  const t = raw.trim().toUpperCase()
  if (t === 'CRDT' || t === 'CREDIT') return 'CRDT'
  if (t === 'DBIT' || t === 'DEBIT') return 'DBIT'
  return null
}

function normalizeAmountAndIndicator(input: {
  amount: string
  indicator: 'CRDT' | 'DBIT' | null
}): { amount: string; indicator: 'CRDT' | 'DBIT' | null } {
  const trimmed = input.amount.trim()
  if (!trimmed) throw new Error('Missing amount')

  if (trimmed.startsWith('-') && !input.indicator) {
    return { amount: trimmed.slice(1), indicator: 'DBIT' }
  }
  if (trimmed.startsWith('+')) {
    return { amount: trimmed.slice(1), indicator: input.indicator }
  }

  return { amount: trimmed, indicator: input.indicator }
}

export type NordeaRestAccountInfo = {
  iban: string
  currency: string
  ownerName?: string | null
}

export function buildCamt053XmlFromNordeaRestTransactions(input: {
  messageId: string
  createdAtIso: string
  account: NordeaRestAccountInfo
  fromDate: Date
  toDate: Date
  transactions: unknown[]
}): string {
  const bookingFrom = dateToDateOnlyUtc(input.fromDate)
  const bookingTo = dateToDateOnlyUtc(input.toDate)

  const entries = input.transactions
    .map((t, i) => normalizeNordeaRestTransaction(t, { fallbackBookingDate: bookingFrom, index: i + 1 }))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))

  const stmtId = `nordea-rest:${input.account.iban}:${bookingFrom}`

  const stmt: any = {
    Id: stmtId,
    CreDtTm: input.createdAtIso,
    Acct: {
      Id: { IBAN: input.account.iban },
      Ccy: input.account.currency,
      Ownr: input.account.ownerName ? { Nm: input.account.ownerName } : undefined,
    },
    FrToDt: { FrDt: bookingFrom, ToDt: bookingTo },
    Ntry: entries.map((e) => ({
      Amt: { '@_Ccy': e.currency, '#text': e.amount },
      CdtDbtInd: e.creditDebitIndicator,
      Sts: e.status,
      BookgDt: { Dt: e.bookingDate },
      ValDt: e.valueDate ? { Dt: e.valueDate } : undefined,
      NtryRef: e.ntryRef,
      AcctSvcrRef: e.acctSvcrRef,
      AddtlNtryInf: e.additionalInfo,
      NtryDtls: {
        TxDtls: {
          Refs: e.refs,
          AddtlTxInf: e.txAdditionalInfo,
          RmtInf: e.remittanceUstrd?.length ? { Ustrd: e.remittanceUstrd } : undefined,
          RltdPties: e.rltdPties,
        },
      },
    })),
  }

  const doc: any = {
    Document: {
      BkToCstmrStmt: {
        GrpHdr: {
          MsgId: input.messageId,
          CreDtTm: input.createdAtIso,
        },
        Stmt: stmt,
      },
    },
  }

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    suppressEmptyNode: true,
    format: false,
  })

  return `<?xml version="1.0" encoding="UTF-8"?>${builder.build(doc)}`
}

function normalizeNordeaRestTransaction(
  tx: unknown,
  input: { fallbackBookingDate: DateOnly; index: number },
): {
  amount: string
  currency: string
  creditDebitIndicator: 'CRDT' | 'DBIT' | null
  status: string | null
  bookingDate: DateOnly
  valueDate: DateOnly | null
  ntryRef: string
  acctSvcrRef: string | null
  additionalInfo: string | null
  txAdditionalInfo: string | null
  remittanceUstrd: string[]
  refs: Record<string, string> | undefined
  rltdPties: any | undefined
} | null {
  if (!tx || typeof tx !== 'object') return null
  const obj = tx as Record<string, any>

  const bookingDate =
    asDateOnly(pick(obj.booking_date, obj.bookingDate, obj.bookg_date, obj.bookgDt, obj.bookingDateIso)) ??
    input.fallbackBookingDate

  const valueDate = asDateOnly(pick(obj.value_date, obj.valueDate, obj.val_date, obj.valueDateIso))

  const currency = pick(obj.currency, obj.ccy, obj.Ccy, obj.amount?.currency, obj.amount?.ccy)
  const amountRaw = pick(obj.amount, obj.transaction_amount, obj.transactionAmount, obj.amount?.value, obj.amount?.amount)

  if (!currency || !amountRaw) return null

  const indicator = normalizeCreditDebitIndicator(
    pick(
      obj.credit_debit_indicator,
      obj.creditDebitIndicator,
      obj.cdt_dbt_ind,
      obj.CdtDbtInd,
      obj.debit_credit_indicator,
    ),
  )

  const normalizedAmt = normalizeAmountAndIndicator({ amount: amountRaw, indicator })

  const id = pick(obj.transaction_id, obj.transactionId, obj.id, obj.reference, obj.ntryRef, obj.acct_svcr_ref)
  const ntryRef = id ?? `nordea-rest:${sha256Hex(stableJsonStringify(obj)).slice(0, 32)}`

  const status = pick(obj.status, obj.booking_status, obj.Sts)

  const additionalInfo = pick(obj.text, obj.message, obj.remittance_information, obj.remittanceInformation, obj.details)

  const remittanceText = pick(obj.remittance, obj.remittance_text, obj.remittanceText, obj.narrative)
  const remittanceUstrd = remittanceText ? [remittanceText] : []

  const debtorName = pick(obj.debtor_name, obj.debtorName, obj.dbtr_name)
  const creditorName = pick(obj.creditor_name, obj.creditorName, obj.cdtr_name)

  const refs: Record<string, string> = {}
  const endToEndId = pick(obj.end_to_end_id, obj.endToEndId)
  const instrId = pick(obj.instr_id, obj.instrId)
  const pmtInfId = pick(obj.pmt_inf_id, obj.pmtInfId)

  if (endToEndId) refs.EndToEndId = endToEndId
  if (instrId) refs.InstrId = instrId
  if (pmtInfId) refs.PmtInfId = pmtInfId

  const rltdPties = debtorName || creditorName
    ? {
        Dbtr: debtorName ? { Nm: debtorName } : undefined,
        Cdtr: creditorName ? { Nm: creditorName } : undefined,
      }
    : undefined

  return {
    amount: normalizedAmt.amount,
    currency,
    creditDebitIndicator: normalizedAmt.indicator,
    status,
    bookingDate,
    valueDate: valueDate ?? null,
    ntryRef,
    acctSvcrRef: pick(obj.acct_svcr_ref, obj.acctSvcrRef, obj.account_servicer_reference),
    additionalInfo,
    txAdditionalInfo: null,
    remittanceUstrd,
    refs: Object.keys(refs).length ? refs : undefined,
    rltdPties,
  }
}
