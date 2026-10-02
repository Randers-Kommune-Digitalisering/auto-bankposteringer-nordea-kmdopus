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
  entryGroupSize: number
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
  total_samleposter: number | string | null
  id: string | null
  statement_id: string | null
  entry_index: number | null
  account_id: string | null
  booking_date: Date | string | null
  credit_debit_indicator: string | null
  ntry_ref: string | null
  ntry_acct_svcr_ref: string | null
  entry_group_size: number | string | null
  samlepost_id: string | null
  transaction_type_values: string[] | null
}

export type TransactionStackSortKey = 'counterpart' | 'transactionType'

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
  const sortColumn = input.sortKey === 'counterpart'
    ? sql`counterpart_sort_value`
    : sql`transaction_type_value`
  const sortDirection = input.sortDirection === 'desc' ? sql.raw('desc') : sql.raw('asc')
  const stackOrdering = input.sortKey
    ? sql`coalesce(${sortColumn}, '') collate "da-x-icu" ${sortDirection}, samlepost_id asc`
    : sql`stack_order`
  const typeFilter = input.transactionTypeFilter?.length
    ? sql`transaction_type_value in (${sql.join(input.transactionTypeFilter.map(value => sql`${value}`), sql`, `)})`
    : sql`true`
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
          and lower(catalog.provider::text) = lower(btrim(normalized_rows.account_provider::text))
          and upper(regexp_replace(btrim(catalog.code_key), '[[:space:]]+', '', 'g')) = normalized_rows.transaction_type_code_key
        order by catalog.created_at desc
        limit 1
      ) as transaction_type_catalog on true`
    : sql``

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
        transaction.amount,
        transaction.dbtr_name as debtor_name,
        transaction.dbtr_id as debtor_id,
        transaction.cdtr_name as creditor_name,
        transaction.cdtr_id as creditor_id,
        transaction.ultmt_dbtr_name as ultimate_debtor_name,
        transaction.ultmt_cdtr_name as ultimate_creditor_name,
        transaction.dbtr_acct_iban as debtor_account_iban,
        transaction.cdtr_acct_iban as creditor_account_iban,
        transaction.bk_tx_cd_domain,
        transaction.bk_tx_cd_family,
        transaction.bk_tx_cd_sub_family,
        transaction.bk_tx_cd_proprietary,
        account.provider as account_provider
      from transaction
      left join transaction_processing
        on transaction_processing.transaction_id = transaction.id
      left join account
        on account.id = transaction.account
      left join manual_booking_draft
        on manual_booking_draft.transaction_id = transaction.id
      where ${input.whereClause ?? sql`true`}
    ),
    grouped_rows as (
      select
        filtered_rows.*,
        count(*) over (
          partition by statement_id, entry_index
        )::int as entry_group_size,
        row_number() over (
          order by booking_date desc, id desc
        ) as row_order
      from filtered_rows
    ),
    normalized_rows as (
      select
        grouped_rows.*,
        case
          when credit_debit_indicator::text = 'DBIT' or amount < 0 then
            coalesce(
              nullif(btrim(creditor_name), ''),
              nullif(btrim(creditor_id), ''),
              nullif(btrim(case
                when credit_debit_indicator::text = 'DBIT'
                  then coalesce(creditor_name, ultimate_creditor_name, creditor_id, creditor_account_iban)
                else coalesce(debtor_name, ultimate_debtor_name, debtor_id, debtor_account_iban)
              end), '')
            )
          else
            coalesce(
              nullif(btrim(debtor_name), ''),
              nullif(btrim(debtor_id), ''),
              nullif(btrim(case
                when credit_debit_indicator::text = 'DBIT'
                  then coalesce(creditor_name, ultimate_creditor_name, creditor_id, creditor_account_iban)
                else coalesce(debtor_name, ultimate_debtor_name, debtor_id, debtor_account_iban)
              end), '')
            )
        end as counterpart_sort_value,
        case
          when nullif(btrim(bk_tx_cd_proprietary), '') is not null then
            nullif(btrim(bk_tx_cd_proprietary), '')
          else
            nullif(concat_ws('/',
              nullif(btrim(bk_tx_cd_domain), ''),
              case
                when lower(nullif(btrim(bk_tx_cd_family), '')) = lower(nullif(btrim(bk_tx_cd_domain), '')) then null
                else nullif(btrim(bk_tx_cd_family), '')
              end,
              case
                when lower(nullif(btrim(bk_tx_cd_sub_family), '')) in (
                  lower(nullif(btrim(bk_tx_cd_domain), '')),
                  lower(nullif(btrim(bk_tx_cd_family), ''))
                ) then null
                else nullif(btrim(bk_tx_cd_sub_family), '')
              end
            ), '')
        end as transaction_type_fallback,
        case
          when nullif(btrim(bk_tx_cd_proprietary), '') is not null then
            'PRTRY:' || upper(regexp_replace(btrim(bk_tx_cd_proprietary), '[[:space:]]+', '', 'g'))
          else
            upper(regexp_replace(concat_ws('/',
              nullif(btrim(bk_tx_cd_domain), ''),
              case
                when lower(nullif(btrim(bk_tx_cd_family), '')) = lower(nullif(btrim(bk_tx_cd_domain), '')) then null
                else nullif(btrim(bk_tx_cd_family), '')
              end,
              case
                when lower(nullif(btrim(bk_tx_cd_sub_family), '')) in (
                  lower(nullif(btrim(bk_tx_cd_domain), '')),
                  lower(nullif(btrim(bk_tx_cd_family), ''))
                ) then null
                else nullif(btrim(bk_tx_cd_sub_family), '')
              end
            ), '[[:space:]]+', '', 'g'))
        end as transaction_type_code_key,
        nullif(upper(btrim(regexp_replace(coalesce(ntry_ref, ''), '[[:space:]]+', ' ', 'g'))), '') as normalized_ntry_ref,
        nullif(upper(btrim(regexp_replace(coalesce(ntry_acct_svcr_ref, ''), '[[:space:]]+', ' ', 'g'))), '') as normalized_ntry_acct_svcr_ref,
        upper(coalesce(credit_debit_indicator::text, 'UNKNOWN')) as normalized_credit_debit_indicator
      from grouped_rows
    ),
    presented_rows as (
      select
        normalized_rows.*,
        case
          when lower(coalesce(counterpart_sort_value, '')) in ('-', '–', 'ukendt type', 'ukendt') then null
          else counterpart_sort_value
        end as display_counterpart_sort_value,
        ${transactionTypeValue} as transaction_type_value
      from normalized_rows
      ${transactionTypeCatalogJoin}
    ),
    identified_rows as (
      select
        presented_rows.*,
        case
          when statement_id is not null
            and entry_index >= 1
            and entry_group_size >= 2
            and (normalized_ntry_ref is not null or normalized_ntry_acct_svcr_ref is not null)
          then
            'group:nordea:batch:' || account_id || ':' || to_char(booking_date, 'YYYY-MM-DD') || ':' ||
            normalized_credit_debit_indicator || ':' || coalesce(normalized_ntry_ref, '-') || ':' ||
            coalesce(normalized_ntry_acct_svcr_ref, '-')
          else 'single:' || id::text
        end as samlepost_id
      from presented_rows
    ),
    stack_representatives as (
      select distinct on (samlepost_id)
        samlepost_id,
        display_counterpart_sort_value,
        transaction_type_value
      from identified_rows
      order by samlepost_id, row_order
    ),
    grouped_stacks as (
      select
        samlepost_id,
        min(row_order) as stack_order,
        count(*)::int as transaction_count,
        stack_representatives.display_counterpart_sort_value as counterpart_sort_value,
        stack_representatives.transaction_type_value
      from identified_rows
      join stack_representatives using (samlepost_id)
      group by
        samlepost_id,
        stack_representatives.display_counterpart_sort_value,
        stack_representatives.transaction_type_value
    ),
    eligible_stacks as (
      select *
      from grouped_stacks
      where ${typeFilter}
    ),
    page_stacks as (
      select
        samlepost_id,
        row_number() over (order by ${stackOrdering}) as sort_order
      from eligible_stacks
      order by ${stackOrdering}
      limit ${input.pageSize}
      offset ${input.offset}
    ),
    totals as (
      select
        coalesce(sum(transaction_count), 0)::int as total_transactions,
        count(*)::int as total_samleposter
      from eligible_stacks
    ),
    distinct_type_options as (
      select distinct transaction_type_value
      from stack_representatives
      where transaction_type_value is not null
    ),
    type_options as (
      select coalesce(
        array_agg(transaction_type_value),
        array[]::text[]
      ) as transaction_type_values
      from distinct_type_options
    )
    select
      totals.total_transactions,
      totals.total_samleposter,
      type_options.transaction_type_values,
      identified_rows.id::text as id,
      identified_rows.statement_id::text as statement_id,
      identified_rows.entry_index,
      identified_rows.account_id,
      identified_rows.booking_date,
      identified_rows.credit_debit_indicator::text as credit_debit_indicator,
      identified_rows.ntry_ref,
      identified_rows.ntry_acct_svcr_ref,
      identified_rows.entry_group_size,
      identified_rows.samlepost_id
    from totals
    cross join type_options
    left join page_stacks on true
    left join identified_rows using (samlepost_id)
    order by page_stacks.sort_order nulls last, identified_rows.row_order nulls last
  `
}

export async function selectPaginatedTransactionKeys(
  input: PaginatedTransactionKeysQueryInput,
): Promise<PaginatedTransactionKeys> {
  const result = await db.execute(buildPaginatedTransactionKeysQuery(input))

  const queryRows = result.rows as QueryRow[]
  const totals = queryRows[0]

  return {
    totalTransactions: Number(totals?.total_transactions ?? 0),
    totalSamleposter: Number(totals?.total_samleposter ?? 0),
    transactionTypeValues: totals?.transaction_type_values ?? [],
    rows: queryRows
      .filter((row): row is QueryRow & { id: string; account_id: string; booking_date: Date | string; entry_group_size: number | string; samlepost_id: string } => Boolean(
        row.id && row.account_id && row.booking_date && row.entry_group_size != null && row.samlepost_id,
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
        entryGroupSize: Number(row.entry_group_size),
        samlepostId: row.samlepost_id,
      })),
  }
}