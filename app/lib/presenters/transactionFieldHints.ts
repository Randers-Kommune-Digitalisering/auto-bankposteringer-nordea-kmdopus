const FIELD_LABELS: Record<string, string> = {
  creditorName: 'Creditor name',
  ultimateCreditorName: 'Ultimate creditor',
  creditorId: 'Creditor id',
  creditorAccountIban: 'Creditor IBAN',
  debtorName: 'Debtor name',
  ultimateDebtorName: 'Ultimate debtor',
  debtorId: 'Debtor id',
  debtorAccountIban: 'Debtor IBAN',
  bkTxCdProprietary: 'BkTxCd (proprietary)',
  bkTxCdDomain: 'BkTxCd (domain)',
  bkTxCdFamily: 'BkTxCd (family)',
  bkTxCdSubFamily: 'BkTxCd (sub family)',
  remittanceUstrd: 'Remittance (Ustrd)',
  remittanceAdditional: 'Remittance additional',
  remittanceCreditorReference: 'Creditor reference',
  entryAdditionalInfo: 'Entry additional info',
  txAdditionalInfo: 'Tx additional info',
  ntryRef: 'NtryRef',
  ntryAcctSvcrRef: 'NtryAcctSvcrRef',
  txAcctSvcrRef: 'TxAcctSvcrRef',
  refsEndToEndId: 'EndToEndId',
  refsInstrId: 'InstrId',
  refsPmtInfId: 'PmtInfId',
  uetr: 'UETR',
  reference: 'Reference',
}

function fromXmlPathToken(token: string): string | undefined {
  const normalized = token.trim().toLowerCase().replace(/^\/+/, '')
  if (!normalized.length) return undefined

  if (normalized.includes('txdtls/refs/endtoendid')) return FIELD_LABELS.refsEndToEndId
  if (normalized.includes('txdtls/refs/instrid')) return FIELD_LABELS.refsInstrId
  if (normalized.includes('txdtls/refs/pmtinfid')) return FIELD_LABELS.refsPmtInfId
  if (normalized.includes('txdtls/refs/uetr')) return FIELD_LABELS.uetr
  if (normalized.includes('txdtls/refs/acctsvcrref')) return FIELD_LABELS.txAcctSvcrRef
  if (normalized.includes('ntry/acctsvcrref')) return FIELD_LABELS.ntryAcctSvcrRef
  if (normalized.endsWith('ntry/ntryref') || normalized === 'ntryref') return FIELD_LABELS.ntryRef
  if (normalized.includes('rmtinf/ustrd')) return FIELD_LABELS.remittanceUstrd
  if (normalized.includes('rmtinf/addtlrmtinf')) return FIELD_LABELS.remittanceAdditional
  if (normalized.includes('strd/cdtrrefinf/ref')) return FIELD_LABELS.remittanceCreditorReference
  if (normalized.endsWith('addtlntryinf')) return FIELD_LABELS.entryAdditionalInfo
  if (normalized.endsWith('addtltxinf')) return FIELD_LABELS.txAdditionalInfo

  return undefined
}

function formatHintToken(token: string): string {
  const normalized = token.trim()
  if (!normalized.length) return normalized
  const fromPath = fromXmlPathToken(normalized)
  if (fromPath) return fromPath
  return FIELD_LABELS[normalized] ?? normalized
}

export function formatTransactionFieldHint(hint?: string | null): string | undefined {
  const normalized = String(hint ?? '').trim()
  if (!normalized.length) return undefined

  if (normalized.includes(' + ')) {
    return normalized
      .split(' + ')
      .map(formatHintToken)
      .join(' + ')
  }

  if (normalized.includes(' | ')) {
    return normalized
      .split(' | ')
      .map(formatHintToken)
      .join(' | ')
  }

  return formatHintToken(normalized)
}
