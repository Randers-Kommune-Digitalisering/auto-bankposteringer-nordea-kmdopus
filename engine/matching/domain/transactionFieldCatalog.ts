export const transactionFieldCatalog = {
  counterpartName: {
    id: 'counterparty_name',
    category: 'part',
    label: 'Modpart',
    pathLabel: 'RltdPties/Dbtr|Cdtr (PstlAdr/AdrLine first, then Nm|Pty/Nm); fallback UltmtDbtr|UltmtCdtr',
    matchField: 'counterparty_name',
    postingTextSource: 'counterparty',
  },
  ntryAcctSvcrRef: {
    id: 'ntry_acct_svcr_ref',
    category: 'reference',
    label: 'Bankens entry-reference',
    pathLabel: 'Ntry/AcctSvcrRef',
    matchField: 'ntry_acct_svcr_ref',
    postingTextSource: 'ntryAcctSvcrRef',
    sourcePath: '/Ntry/AcctSvcrRef',
  },
  entryAdditionalInfo: {
    id: 'entry_additional_info',
    category: 'reference',
    label: 'Yderligere entry-oplysning',
    pathLabel: 'Ntry/AddtlNtryInf',
    matchField: 'entry_additional_info',
    postingTextSource: 'entryAdditionalInfo',
    sourcePath: '/Ntry/AddtlNtryInf',
  },
  bkTxCdDomain: {
    id: 'bk_tx_cd_domain',
    category: 'transaktionstype',
    label: 'Kode-domæne',
    pathLabel: 'Ntry/BkTxCd/Domn/Cd',
    matchField: 'bk_tx_cd_domain',
  },
  bkTxCdFamily: {
    id: 'bk_tx_cd_family',
    category: 'transaktionstype',
    label: 'Kode-familie',
    pathLabel: 'Ntry/BkTxCd/Domn/Fmly/Cd',
    matchField: 'bk_tx_cd_family',
  },
  bkTxCdSubFamily: {
    id: 'bk_tx_cd_sub_family',
    category: 'transaktionstype',
    label: 'Kode-underfamilie',
    pathLabel: 'Ntry/BkTxCd/Domn/Fmly/SubFmlyCd',
    matchField: 'bk_tx_cd_sub_family',
  },
  bkTxCdProprietary: {
    id: 'bk_tx_cd_proprietary',
    category: 'transaktionstype',
    label: 'Bankens transaktionskode',
    pathLabel: 'Ntry/BkTxCd/Prtry/Cd',
    matchField: 'bk_tx_cd_proprietary',
  },
  creditDebitIndicator: {
    id: 'cdt_dbt_ind',
    category: 'transaktionstype',
    label: 'Retning',
    pathLabel: 'Ntry/CdtDbtInd',
    matchField: 'cdt_dbt_ind',
  },
} as const

export type TransactionFieldCatalogEntry = typeof transactionFieldCatalog[keyof typeof transactionFieldCatalog]

export function formatTransactionFieldOptionLabel(field: Pick<TransactionFieldCatalogEntry, 'label' | 'pathLabel'>): string {
  return `${field.label} · ${field.pathLabel}`
}

export function transactionFieldForSourcePath(sourcePath: string): TransactionFieldCatalogEntry | undefined {
  const normalizedPath = sourcePath.trim().replace(/^\/+/, '').toLowerCase()

  return Object.values(transactionFieldCatalog).find((field) => (
    'sourcePath' in field && field.sourcePath.replace(/^\/+/, '').toLowerCase() === normalizedPath
  )) ?? (
    normalizedPath.includes('/txdtls/rltdpties/')
      ? transactionFieldCatalog.counterpartName
      : undefined
  )
}
