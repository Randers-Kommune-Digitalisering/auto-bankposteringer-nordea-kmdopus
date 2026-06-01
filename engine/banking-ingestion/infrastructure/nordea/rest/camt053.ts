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
  const trimmed = normalizeDecimalString(input.amount)
  if (!trimmed) throw new Error('Missing amount')

  if (trimmed.startsWith('-') && !input.indicator) {
    return { amount: trimmed.slice(1), indicator: 'DBIT' }
  }
  if (trimmed.startsWith('+')) {
    return { amount: trimmed.slice(1), indicator: input.indicator }
  }

  return { amount: trimmed, indicator: input.indicator }
}

type ScaledDecimal = { int: bigint; scale: number }
const BIGINT_ZERO = BigInt(0)
const BIGINT_ONE = BigInt(1)
const BIGINT_TEN = BigInt(10)
const BIGINT_NEG_ONE = BigInt(-1)

function pow10BigInt(exp: number): bigint {
  let out = BIGINT_ONE
  for (let i = 0; i < exp; i += 1) out *= BIGINT_TEN
  return out
}

function parseScaledDecimal(value: string): ScaledDecimal {
  const t = normalizeDecimalString(value)
  if (!t) throw new Error('Missing decimal')

  const sign = t.startsWith('-') ? BIGINT_NEG_ONE : BIGINT_ONE
  const unsigned = t.replace(/^[+-]/, '')
  const [intPartRaw, fracRaw = ''] = unsigned.split('.')
  const intPart = (intPartRaw ?? '').replace(/^0+(?=\d)/, '')
  const frac = (fracRaw ?? '').replace(/\D+/g, '')
  const scale = frac.length
  const digits = `${intPart || '0'}${frac}`
  const bi = BigInt(digits || '0')
  return { int: sign * bi, scale }
}

function alignScales(a: ScaledDecimal, b: ScaledDecimal): { a: bigint; b: bigint; scale: number } {
  const scale = Math.max(a.scale, b.scale)
  const aMul = scale > a.scale ? pow10BigInt(scale - a.scale) : BIGINT_ONE
  const bMul = scale > b.scale ? pow10BigInt(scale - b.scale) : BIGINT_ONE
  return { a: a.int * aMul, b: b.int * bMul, scale }
}

function formatScaledDecimal(value: ScaledDecimal): string {
  const sign = value.int < BIGINT_ZERO ? '-' : ''
  const abs = value.int < BIGINT_ZERO ? -value.int : value.int
  if (value.scale <= 0) return `${sign}${abs.toString()}`

  const s = abs.toString().padStart(value.scale + 1, '0')
  const whole = s.slice(0, -value.scale)
  let frac = s.slice(-value.scale)

  // Trim trailing zeros but keep at least 2 decimals if present.
  // (Nordea amounts are typically 2 decimals; but we keep generic parsing.)
  frac = frac.replace(/0+$/, '')
  if (!frac.length) return `${sign}${whole}`
  return `${sign}${whole}.${frac}`
}

function inferOpeningBalanceFromAfterTx(input: {
  balanceAfterTx: string
  amount: string
  indicator: 'CRDT' | 'DBIT'
}): { openingAmountAbs: string; openingIndicator: 'CRDT' | 'DBIT' } {
  const after = parseScaledDecimal(input.balanceAfterTx)
  const amt = parseScaledDecimal(input.amount)
  const { a: afterAligned, b: amtAligned, scale } = alignScales(after, amt)
  const signedAmt = input.indicator === 'DBIT' ? -amtAligned : amtAligned
  const openingAligned = afterAligned - signedAmt

  const opening: ScaledDecimal = { int: openingAligned, scale }
  const openingIndicator: 'CRDT' | 'DBIT' = opening.int < BIGINT_ZERO ? 'DBIT' : 'CRDT'
  const openingAbs: ScaledDecimal = { int: opening.int < BIGINT_ZERO ? -opening.int : opening.int, scale }
  return {
    openingAmountAbs: formatScaledDecimal(openingAbs),
    openingIndicator,
  }
}

function normalizeDecimalString(value: string): string {
  const raw = value.trim()
  if (!raw) return ''

  const compact = raw.replace(/[\s\u00A0]/g, '')
  const lastComma = compact.lastIndexOf(',')
  const lastDot = compact.lastIndexOf('.')

  let normalized = compact

  // Same heuristic as matching layer: last separator decides decimal separator.
  if (lastComma !== -1 && lastDot !== -1) {
    const commaIsDecimal = lastComma > lastDot
    if (commaIsDecimal) {
      normalized = normalized.replace(/\./g, '').replace(/,/g, '.')
    } else {
      normalized = normalized.replace(/,/g, '')
    }
  } else if (lastComma !== -1) {
    normalized = normalized.replace(/,/g, '.')
  } else {
    normalized = normalized.replace(/,/g, '')
  }

  return normalized.trim()
}

function normalizeIban(value: unknown): string | null {
  const raw = asString(value)
  if (!raw) return null
  return raw.replace(/\s+/g, '').toUpperCase()
}

function looksLikeNonInformativeCounterpartyName(value: string | null): boolean {
  if (!value) return true
  const t = value.trim()
  if (!t) return true
  // Nordea sometimes provides technical identifiers (e.g. short regnr) in counterparty_name.
  // If it's only digits and very short, treat it as non-informative for UI counterpart.
  if (/^\d{1,6}$/.test(t)) return true
  return false
}

function toScale(value: ScaledDecimal, scale: number): bigint {
  if (scale === value.scale) return value.int
  if (scale > value.scale) return value.int * pow10BigInt(scale - value.scale)
  // Should not happen in our usage (we always align to max scale).
  return value.int / pow10BigInt(value.scale - scale)
}

function entryChainScore(entries: Array<{
  amount: string
  creditDebitIndicator: 'CRDT' | 'DBIT' | null
  balanceAfterTransaction: string | null
}>): number {
  let score = 0
  for (let i = 0; i < entries.length - 1; i += 1) {
    const a = entries[i]!
    const b = entries[i + 1]!

    if (!a.balanceAfterTransaction || !b.balanceAfterTransaction) continue
    if (!b.creditDebitIndicator) continue

    try {
      const afterA = parseScaledDecimal(a.balanceAfterTransaction)
      const afterB = parseScaledDecimal(b.balanceAfterTransaction)
      const amtB = parseScaledDecimal(b.amount)

      const scale = Math.max(afterA.scale, afterB.scale, amtB.scale)
      const afterAInt = toScale(afterA, scale)
      const afterBInt = toScale(afterB, scale)
      const amtBInt = toScale(amtB, scale)

      const signedAmtB = b.creditDebitIndicator === 'DBIT' ? -amtBInt : amtBInt
      const beforeBInt = afterBInt - signedAmtB

      if (afterAInt === beforeBInt) score += 1
    } catch {
      // ignore
    }
  }
  return score
}

function pickPartyName(obj: Record<string, any>, side: 'debtor' | 'creditor'): string | null {
  if (side === 'debtor') {
    return pick(
      obj.debtor_name,
      obj.debtorName,
      obj.dbtr_name,
      obj.payer_name,
      obj.payerName,
      obj.sender_name,
      obj.senderName,
      obj.from_name,
      obj.fromName,
      obj.debtor?.name,
      obj.debtor?.Nm,
    )
  }

  return pick(
    obj.creditor_name,
    obj.creditorName,
    obj.cdtr_name,
    obj.payee_name,
    obj.payeeName,
    obj.receiver_name,
    obj.receiverName,
    obj.to_name,
    obj.toName,
    obj.creditor?.name,
    obj.creditor?.Nm,
  )
}

function pickPartyIban(obj: Record<string, any>, side: 'debtor' | 'creditor'): string | null {
  if (side === 'debtor') {
    return normalizeIban(
      pick(
        obj.debtor_account_iban,
        obj.debtorAccountIban,
        obj.dbtr_acct_iban,
        obj.payer_account_iban,
        obj.payerAccountIban,
        obj.sender_account_iban,
        obj.senderAccountIban,
        obj.debtor?.account?.iban,
        obj.debtor?.accountIban,
      ),
    )
  }

  return normalizeIban(
    pick(
      obj.creditor_account_iban,
      obj.creditorAccountIban,
      obj.cdtr_acct_iban,
      obj.payee_account_iban,
      obj.payeeAccountIban,
      obj.receiver_account_iban,
      obj.receiverAccountIban,
      obj.creditor?.account?.iban,
      obj.creditor?.accountIban,
    ),
  )
}

function pickTransactionType(obj: Record<string, any>): string | null {
  return pick(
    obj.type_description,
    obj.typeDescription,
    obj.transaction_type,
    obj.transactionType,
    obj.type,
    obj.tx_type,
    obj.txType,
    obj.category,
    obj.sub_category,
    obj.subCategory,
    obj.payment_type,
    obj.paymentType,
    obj.transaction_code,
    obj.transactionCode,
    obj.bk_tx_cd,
    obj.bkTxCd,
  )
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

  const entriesUnsorted = input.transactions
    .map((t, i) => normalizeNordeaRestTransaction(t, { fallbackBookingDate: bookingFrom, index: i + 1 }))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))

  const sortByBookingDateAsc = (a: { bookingDate: string }, b: { bookingDate: string }) =>
    a.bookingDate.localeCompare(b.bookingDate)

  const candidateAsc = entriesUnsorted.slice().sort((a, b) => {
    const d = sortByBookingDateAsc(a, b)
    if (d !== 0) return d
    return a.index - b.index
  })

  const candidateDesc = entriesUnsorted.slice().sort((a, b) => {
    const d = sortByBookingDateAsc(a, b)
    if (d !== 0) return d
    return b.index - a.index
  })

  const scoreAsc = entryChainScore(candidateAsc)
  const scoreDesc = entryChainScore(candidateDesc)
  const entries = scoreDesc > scoreAsc ? candidateDesc : candidateAsc

  // Nordea REST provides a running balance per transaction (balance_after_transaction).
  // Our downstream runningBalance view is computed from statement OPBD + signed amounts.
  // So we infer OPBD from the first transaction that has balance_after_transaction.
  const openingBalance = (() => {
    const first = entries.find((e) => e.balanceAfterTransaction && e.creditDebitIndicator)
    if (!first || !first.balanceAfterTransaction || !first.creditDebitIndicator) return null
    try {
      const inferred = inferOpeningBalanceFromAfterTx({
        balanceAfterTx: first.balanceAfterTransaction,
        amount: first.amount,
        indicator: first.creditDebitIndicator,
      })
      return {
        amountAbs: inferred.openingAmountAbs,
        indicator: inferred.openingIndicator,
        currency: first.currency,
      }
    } catch {
      return null
    }
  })()

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
    Bal: openingBalance
      ? [
          {
            Tp: { CdOrPrtry: { Cd: 'OPBD' } },
            Amt: { '@_Ccy': openingBalance.currency, '#text': openingBalance.amountAbs },
            CdtDbtInd: openingBalance.indicator,
            Dt: { Dt: bookingFrom },
          },
        ]
      : undefined,
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
          BkTxCd: e.bkTxCdProprietary ? { Prtry: { Cd: e.bkTxCdProprietary } } : undefined,
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
  index: number
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
  bkTxCdProprietary: string | null
  balanceAfterTransaction: string | null
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

  const balanceAfterRaw = pick(
    obj.balance_after_transaction,
    obj.balanceAfterTransaction,
    obj.balance_after,
    obj.balanceAfter,
    obj.running_balance,
    obj.runningBalance,
  )
  const balanceAfterTransaction = balanceAfterRaw ? normalizeDecimalString(balanceAfterRaw) : null

  const id = pick(obj.transaction_id, obj.transactionId, obj.id, obj.reference, obj.ntryRef, obj.acct_svcr_ref)
  const ntryRef = id ?? `nordea-rest:${sha256Hex(stableJsonStringify(obj)).slice(0, 32)}`

  const status = pick(obj.status, obj.booking_status, obj.Sts)

  const additionalInfo = pick(obj.text, obj.message, obj.remittance_information, obj.remittanceInformation, obj.details)

  const remittanceText = pick(obj.remittance, obj.remittance_text, obj.remittanceText, obj.narrative)
  const remittanceUstrd = remittanceText ? [remittanceText] : []

  const debtorNameExplicit = pickPartyName(obj, 'debtor')
  const creditorNameExplicit = pickPartyName(obj, 'creditor')
  const debtorAccountIban = pickPartyIban(obj, 'debtor')
  const creditorAccountIban = pickPartyIban(obj, 'creditor')

  const typeDescription = pick(obj.type_description, obj.typeDescription)
  const counterpartyNameRaw = pick(
    obj.counterparty_name,
    obj.counterpartyName,
    obj.counterpart_name,
    obj.counterpartName,
    obj.other_party_name,
    obj.otherPartyName,
    obj.partner_name,
    obj.partnerName,
  )

  const counterpartyName = looksLikeNonInformativeCounterpartyName(counterpartyNameRaw) ? null : counterpartyNameRaw

  // For most Nordea REST payloads, counterparty_name is the human-readable counterpart.
  // CAMT semantics: for CRDT entries, counterparty is typically the debtor (sender).
  // For DBIT entries, counterparty is typically the creditor (receiver).
  // If the indicator is missing, set both so UI/logic can still display a modpart.
  const debtorName = debtorNameExplicit ?? (
    normalizedAmt.indicator === 'CRDT'
      ? counterpartyName
      : normalizedAmt.indicator == null
        ? counterpartyName
        : null
  )
  const creditorName = creditorNameExplicit ?? (
    normalizedAmt.indicator === 'DBIT'
      ? counterpartyName
      : normalizedAmt.indicator == null
        ? counterpartyName
        : null
  )

  const refs: Record<string, string> = {}
  const endToEndId = pick(obj.end_to_end_id, obj.endToEndId)
  const instrId = pick(obj.instr_id, obj.instrId)
  const pmtInfId = pick(obj.pmt_inf_id, obj.pmtInfId)

  if (endToEndId) refs.EndToEndId = endToEndId
  if (instrId) refs.InstrId = instrId
  if (pmtInfId) refs.PmtInfId = pmtInfId

  const rltdPties = debtorName || creditorName || debtorAccountIban || creditorAccountIban
    ? {
        Dbtr: debtorName ? { Nm: debtorName } : undefined,
        DbtrAcct: debtorAccountIban ? { Id: { IBAN: debtorAccountIban } } : undefined,
        Cdtr: creditorName ? { Nm: creditorName } : undefined,
        CdtrAcct: creditorAccountIban ? { Id: { IBAN: creditorAccountIban } } : undefined,
      }
    : undefined

  const bkTxCdProprietary = typeDescription ?? pickTransactionType(obj)

  return {
    index: input.index,
    amount: normalizedAmt.amount,
    currency,
    creditDebitIndicator: normalizedAmt.indicator,
    status,
    bookingDate,
    valueDate: valueDate ?? null,
    ntryRef,
    acctSvcrRef: pick(obj.acct_svcr_ref, obj.acctSvcrRef, obj.account_servicer_reference),
    additionalInfo,
    // Keep type_description out of free text chips by placing it in BkTxCd; keep other narrative/details as Tx additional info.
    txAdditionalInfo: pick(obj.details, obj.detail, obj.narrative, obj.additional_information, obj.additionalInformation),
    remittanceUstrd,
    refs: Object.keys(refs).length ? refs : undefined,
    rltdPties,
    bkTxCdProprietary,
    balanceAfterTransaction,
  }
}
