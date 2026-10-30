import { sql, type SQL } from 'drizzle-orm'
import db from '~/lib/db'

export type PaginatedTransactionKey = {
  id: string
  statementId: string | null
  entryIndex: number | null
  accountId: string
  bookingDate: Date | string
  creditDebitIndicator: string | null
  ntryRef: string | null
  ntryAcctSvcrRef: string | null
  samlepostId: string
}

export type PaginatedTransactionKeys = {
  rows: PaginatedTransactionKey[]
  totalTransactions: number
  totalSamleposter: number
  transactionTypeValues: string[]
}

type QueryRow = {
  total_transactions: number | string | null
  transaction_type_values: string[] | null
  id: string | null
  statement_id: string | null
  entry_index: number | null
  account_id: string | null
  booking_date: Date | string | null
  credit_debit_indicator: string | null
  ntry_ref: string | null
  ntry_acct_svcr_ref: string | null
  samlepost_id: string | null
}

export type TransactionStackSortKey = 'transactionType'

export type PaginatedTransactionKeysQueryInput = {
  whereClause?: SQL
  pageSize: number
  offset: number
  sortKey?: TransactionStackSortKey
  sortDirection?: 'asc' | 'desc'
  transactionTypeFilter?: string[]
  includeTransactionTypeValues?: boolean
}

export function buildPaginatedTransactionKeysQuery(input: PaginatedTransactionKeysQueryInput): SQL {
  const needsTransactionTypePresentation = input.includeTransactionTypeValues !== false
    || input.sortKey === 'transactionType'
    || Boolean(input.transactionTypeFilter?.length)
  const transactionTypeValue = needsTransactionTypePresentation
    ? sql`case
        when lower(coalesce(nullif(btrim(transaction_type_catalog.display_name), ''), transaction_type_fallback, ''))
          in ('-', '–', 'ukendt type', 'ukendt') then null
        else nullif(btrim(coalesce(nullif(btrim(transaction_type_catalog.display_name), ''), transaction_type_fallback)), '')
      end`
    : sql`null::text`
  const transactionTypeCatalogJoin = needsTransactionTypePresentation
    ? sql`left join lateral (
        select catalog.display_name
        from transaction_code_catalog as catalog
        where catalog.is_active = true
          and lower(catalog.provider::text) = lower(btrim(filtered_rows.account_provider::text))
          and upper(regexp_replace(btrim(catalog.code_key), '[[:space:]]+', '', 'g')) = filtered_rows.transaction_type_code_key
        order by catalog.created_at desc
        limit 1
      ) as transaction_type_catalog on true`
    : sql``
  const sortDirection = input.sortDirection === 'desc' ? sql.raw('desc') : sql.raw('asc')
  const sortOrder = input.sortKey === 'transactionType'
    ? sql`transaction_type_value collate "da-x-icu" ${sortDirection} nulls last, booking_date desc, id desc`
    : sql`booking_date desc, id desc`
  const typeFilter = input.transactionTypeFilter?.length
    ? sql`transaction_type_value in (${sql.join(input.transactionTypeFilter.map(value => sql`${value}`), sql`, `)})`
    : sql`true`

  return sql`
    with filtered_rows as materialized (
      select
        transaction.id,
        transaction.statement_id,
        transaction.entry_index,
        transaction.account as account_id,
        transaction.booking_date,
        transaction.credit_debit_indicator,
        transaction.ntry_ref,
        transaction.ntry_acct_svcr_ref,
        transaction.bk_tx_cd_domain,
        transaction.bk_tx_cd_family,
        transaction.bk_tx_cd_sub_family,
        transaction.bk_tx_cd_proprietary,
        account.provider as account_provider,
        case
          when nullif(btrim(transaction.bk_tx_cd_proprietary), '') is not null then
            nullif(btrim(transaction.bk_tx_cd_proprietary), '')
          else
            nullif(concat_ws('/',
              nullif(btrim(transaction.bk_tx_cd_domain), ''),
              case
                when lower(nullif(btrim(transaction.bk_tx_cd_family), '')) = lower(nullif(btrim(transaction.bk_tx_cd_domain), '')) then null
                else nullif(btrim(transaction.bk_tx_cd_family), '')
              end,
              case
                when lower(nullif(btrim(transaction.bk_tx_cd_sub_family), '')) in (
                  lower(nullif(btrim(transaction.bk_tx_cd_domain), '')),
                  lower(nullif(btrim(transaction.bk_tx_cd_family), ''))
                ) then null
                else nullif(btrim(transaction.bk_tx_cd_sub_family), '')
              end
            ), '')
        end as transaction_type_fallback,
        case
          when nullif(btrim(transaction.bk_tx_cd_proprietary), '') is not null then
            'PRTRY:' || upper(regexp_replace(btrim(transaction.bk_tx_cd_proprietary), '[[:space:]]+', '', 'g'))
          else
            upper(regexp_replace(concat_ws('/',
              nullif(btrim(transaction.bk_tx_cd_domain), ''),
              case
                when lower(nullif(btrim(transaction.bk_tx_cd_family), '')) = lower(nullif(btrim(transaction.bk_tx_cd_domain), '')) then null
                else nullif(btrim(transaction.bk_tx_cd_family), '')
              end,
              case
                when lower(nullif(btrim(transaction.bk_tx_cd_sub_family), '')) in (
                  lower(nullif(btrim(transaction.bk_tx_cd_domain), '')),
                  lower(nullif(btrim(transaction.bk_tx_cd_family), ''))
                ) then null
                else nullif(btrim(transaction.bk_tx_cd_sub_family), '')
              end
            ), '[[:space:]]+', '', 'g'))
        end as transaction_type_code_key
      from transaction
      left join transaction_processing
        on transaction_processing.transaction_id = transaction.id
      left join account
        on account.id = transaction.account
      left join manual_booking_draft
        on manual_booking_draft.transaction_id = transaction.id
      where ${input.whereClause ?? sql`true`}
    ),
    presented_rows as (
      select
        filtered_rows.*,
        ${transactionTypeValue} as transaction_type_value
      from filtered_rows
      ${transactionTypeCatalogJoin}
    ),
    eligible_rows as (
      select *
      from presented_rows
      where ${typeFilter}
    ),
    page_rows as (
      select
        eligible_rows.*,
        row_number() over (order by ${sortOrder}) as sort_order
      from eligible_rows
      order by ${sortOrder}
      limit ${input.pageSize}
      offset ${input.offset}
    ),
    totals as (
      select count(*)::int as total_transactions
      from eligible_rows
    ),
    type_options as (
      select coalesce(array_agg(transaction_type_value), array[]::text[]) as transaction_type_values
      from (
        select distinct transaction_type_value
        from presented_rows
        where transaction_type_value is not null
      ) distinct_types
    )
    select
      totals.total_transactions,
      type_options.transaction_type_values,
      page_rows.id::text as id,
      page_rows.statement_id::text as statement_id,
      page_rows.entry_index,
      page_rows.account_id,
      page_rows.booking_date,
      page_rows.credit_debit_indicator::text as credit_debit_indicator,
      page_rows.ntry_ref,
      page_rows.ntry_acct_svcr_ref,
      'single:' || page_rows.id::text as samlepost_id
    from totals
    cross join type_options
    left join page_rows on true
    order by page_rows.sort_order nulls last
  `
}

export async function selectPaginatedTransactionKeys(
  input: PaginatedTransactionKeysQueryInput,
): Promise<PaginatedTransactionKeys> {
  const result = await db.execute(buildPaginatedTransactionKeysQuery(input))
  const queryRows = result.rows as QueryRow[]
  const totals = queryRows[0]
  const totalTransactions = Number(totals?.total_transactions ?? 0)

  return {
    totalTransactions,
    totalSamleposter: totalTransactions,
    transactionTypeValues: totals?.transaction_type_values ?? [],
    rows: queryRows
      .filter((row): row is QueryRow & { id: string; account_id: string; booking_date: Date | string; samlepost_id: string } => Boolean(
        row.id && row.account_id && row.booking_date && row.samlepost_id,
      ))
      .map(row => ({
        id: row.id,
        statementId: row.statement_id,
        entryIndex: row.entry_index,
        accountId: row.account_id,
        bookingDate: row.booking_date,
        creditDebitIndicator: row.credit_debit_indicator,
        ntryRef: row.ntry_ref,
        ntryAcctSvcrRef: row.ntry_acct_svcr_ref,
        samlepostId: row.samlepost_id,
      })),
  }
}
