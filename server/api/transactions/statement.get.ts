import { desc, eq, inArray, sql } from "drizzle-orm";
import { defineEventHandler, getQuery, setHeader } from "h3";
import db from "~/lib/db";
import { account } from "~/lib/db/schema/account";
import { transaction, transactionProcessing } from "~/lib/db/schema/transaction";
import { transactionCodeCatalog } from "~/lib/db/schema/transactionCodeCatalog";
import type { StatementTransaction } from "~/types/transactions";
import { buildNordeaDeterministicGroupKey } from "#engine/banking-ingestion/handlers/camt053/nordeaAdditionalEntryInfo";

function formatDate(value: Date | string | null): string {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    if (value.length >= 10) return value.slice(0, 10);
    return new Date(value).toISOString().slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
}

function parseDateParam(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  if (!value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseStringArrayParam(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .flatMap((v) => (typeof v === "string" ? v.split(",") : []))
      .map((v) => v.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

function parseStringParam(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim()
}

function escapeLike(value: string): string {
  // Escape LIKE wildcards and backslashes.
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

function toDateOnlyDate(value: Date | string | null): Date {
  if (value instanceof Date) return value
  const parsed = value ? new Date(value) : new Date()
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function toTopTransactionStackId(input: {
  id: string | null
  accountId: string | null
  bookingDate: Date | string | null
  creditDebitIndicator: string | null
  ntryRef: string | null
  entryAdditionalInfo: string | null
  ntryAcctSvcrRef: string | null
}): string {
  const groupKey = buildNordeaDeterministicGroupKey({
    accountId: input.accountId ?? '',
    bookingDate: toDateOnlyDate(input.bookingDate),
    creditDebitIndicator: input.creditDebitIndicator ?? null,
    ntryRef: input.ntryRef ?? null,
    entryAdditionalInfo: input.entryAdditionalInfo ?? null,
    ntryAcctSvcrRef: input.ntryAcctSvcrRef ?? null,
  })

  if (groupKey) return `group:${groupKey}`
  return `single:${String(input.id ?? '')}`
}

type TransactionTypeRow = {
  bankProvider: string | null
  bkTxCdProprietary: string | null
  bkTxCdDomain: string | null
  bkTxCdFamily: string | null
  bkTxCdSubFamily: string | null
}

function buildTransactionCodeKey(row: TransactionTypeRow): string | null {
  if (row.bkTxCdProprietary && row.bkTxCdProprietary.trim().length) {
    return `PRTRY:${row.bkTxCdProprietary.trim()}`
  }

  const parts = [row.bkTxCdDomain, row.bkTxCdFamily, row.bkTxCdSubFamily]
    .map((value) => (value ? value.trim() : ''))
    .filter(Boolean)

  return parts.length ? parts.join('/') : null
}

function normalizeProvider(value: string | null | undefined): 'danskebank' | 'nordea' | 'bankconnect' | null {
  const normalized = String(value ?? '').trim().toLowerCase()
  if (normalized === 'danskebank') return 'danskebank'
  if (normalized === 'nordea') return 'nordea'
  if (normalized === 'bankconnect') return 'bankconnect'
  return null
}

function resolveTransactionTypeHint(row: TransactionTypeRow): string | null {
  if (row.bkTxCdProprietary && row.bkTxCdProprietary.trim().length) {
    return 'bkTxCdProprietary'
  }

  const sourceParts: string[] = []
  if (row.bkTxCdDomain?.trim()) sourceParts.push('bkTxCdDomain')
  if (row.bkTxCdFamily?.trim()) sourceParts.push('bkTxCdFamily')
  if (row.bkTxCdSubFamily?.trim()) sourceParts.push('bkTxCdSubFamily')

  return sourceParts.length ? sourceParts.join(' + ') : null
}

function resolveTransactionType(input: {
  row: TransactionTypeRow
  catalogDisplayNameByCodeKey: Map<string, string>
}): string | null {
  const codeKey = buildTransactionCodeKey(input.row)
  if (!codeKey) return null

  const provider = normalizeProvider(input.row.bankProvider)
  const displayName = provider
    ? input.catalogDisplayNameByCodeKey.get(`${provider}:${codeKey.toUpperCase()}`)
    : undefined
  if (displayName) return displayName

  if (codeKey.startsWith('PRTRY:')) {
    return codeKey.slice('PRTRY:'.length)
  }

  return codeKey
}

async function loadTransactionTypeCatalogDisplayNames(rows: TransactionTypeRow[]): Promise<Map<string, string>> {
  const catalogCodeKeys = new Set<string>()
  const catalogProviders = new Set<'danskebank' | 'nordea' | 'bankconnect'>()

  for (const row of rows) {
    const key = buildTransactionCodeKey(row)
    if (key) catalogCodeKeys.add(key)

    const provider = normalizeProvider(row.bankProvider)
    if (provider) catalogProviders.add(provider)
  }

  if (!catalogCodeKeys.size || !catalogProviders.size) {
    return new Map<string, string>()
  }

  if (!(await hasTransactionCodeCatalogTable())) {
    return new Map<string, string>()
  }

  let catalogRows: Array<{
    provider: 'danskebank' | 'nordea' | 'bankconnect'
    codeKey: string
    displayName: string
  }> = []

  try {
    catalogRows = await db
      .select({
        provider: transactionCodeCatalog.provider,
        codeKey: transactionCodeCatalog.codeKey,
        displayName: transactionCodeCatalog.displayName,
      })
      .from(transactionCodeCatalog)
      .where(inArray(transactionCodeCatalog.provider, Array.from(catalogProviders)))
  } catch {
    catalogRows = []
  }

  const byCodeKey = new Map<string, string>()
  for (const row of catalogRows) {
    const provider = normalizeProvider(row.provider)
    const key = String(row.codeKey ?? '').trim()
    const name = String(row.displayName ?? '').trim()
    if (!provider || !key || !name || !catalogCodeKeys.has(key)) continue

    byCodeKey.set(`${provider}:${key.toUpperCase()}`, name)
  }

  return byCodeKey
}

async function hasTransactionCodeCatalogTable(): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT to_regclass('public.transaction_code_catalog') AS table_name
    `)
    const row = result.rows[0] as { table_name?: string | null } | undefined
    return Boolean(row?.table_name)
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  // Interactive UI endpoint: must reflect new ingestions immediately.
  setHeader(event, "Cache-Control", "no-store");

  const query = getQuery(event);
  const start = parseDateParam(query.start);
  const end = parseDateParam(query.end);
  const q: any = query as any;
  const page = Math.max(1, Number.parseInt(String(q.page ?? "1"), 10) || 1);
  const pageSize = Math.min(
    200,
    Math.max(1, Number.parseInt(String(q.pageSize ?? "50"), 10) || 50),
  );
  const offset = (page - 1) * pageSize;
  const search = parseStringParam(q.search ?? q.q)
  const like = search ? `%${escapeLike(search)}%` : null
  const accountIds = parseStringArrayParam(
    q.accountIds ??
      q['accountIds[]'] ??
      q.accounts ??
      q['accounts[]'] ??
      q.accountId,
  );

  // The UI always provides start/end; keep a safe fallback for non-UI callers.
  if (!start || !end) {
    const baseQuery = db
      .select({
        id: transaction.id,
        runId: transaction.runId,
        accountId: transaction.accountId,
        bankAccountName: account.name,
        bankProvider: account.provider,

        statementId: transaction.statementId,
        entryIndex: transaction.entryIndex,
        entrySubIndex: transaction.entrySubIndex,

        amount: transaction.amount,
        currency: transaction.currency,
        creditDebitIndicator: transaction.creditDebitIndicator,
        status: transaction.status,
        bookingDate: transaction.bookingDate,
        valueDate: transaction.valueDate,

        ntryRef: transaction.ntryRef,
        ntryAcctSvcrRef: transaction.ntryAcctSvcrRef,
        entryAdditionalInfo: transaction.entryAdditionalInfo,

        txAcctSvcrRef: transaction.txAcctSvcrRef,
        refsEndToEndId: transaction.refsEndToEndId,
        refsInstrId: transaction.refsInstrId,
        refsPmtInfId: transaction.refsPmtInfId,
        uetr: transaction.uetr,
        txAdditionalInfo: transaction.txAdditionalInfo,

        bkTxCdDomain: transaction.bkTxCdDomain,
        bkTxCdFamily: transaction.bkTxCdFamily,
        bkTxCdSubFamily: transaction.bkTxCdSubFamily,
        bkTxCdProprietary: transaction.bkTxCdProprietary,

        debtorName: transaction.debtorName,
        debtorId: transaction.debtorId,
        debtorAccountIban: transaction.debtorAccountIban,
        creditorName: transaction.creditorName,
        creditorId: transaction.creditorId,
        creditorAccountIban: transaction.creditorAccountIban,
        ultimateDebtorName: transaction.ultimateDebtorName,
        ultimateCreditorName: transaction.ultimateCreditorName,

        remittanceUstrd: transaction.remittanceUstrd,
        remittanceCreditorReference: transaction.remittanceCreditorReference,
        remittanceAdditional: transaction.remittanceAdditional,

        processingStatus: transactionProcessing.status,
        ruleApplied: transactionProcessing.ruleApplied,
      })
      .from(transaction)
      .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
      .leftJoin(account, eq(transaction.accountId, account.id))
      .orderBy(desc(transaction.bookingDate), desc(transaction.id));

    const rows = accountIds.length
      ? await baseQuery.where(inArray(transaction.accountId, accountIds))
      : await baseQuery;

    const catalogDisplayNameByCodeKey = await loadTransactionTypeCatalogDisplayNames(rows)

    const payload: StatementTransaction[] = rows.map((row) => ({
      ...row,
      topStackId: toTopTransactionStackId({
        id: row.id,
        accountId: row.accountId,
        bookingDate: row.bookingDate,
        creditDebitIndicator: row.creditDebitIndicator,
        ntryRef: row.ntryRef,
        entryAdditionalInfo: row.entryAdditionalInfo,
        ntryAcctSvcrRef: row.ntryAcctSvcrRef,
      }),
      transactionTypeCode: buildTransactionCodeKey(row),
      transactionTypeHint: resolveTransactionTypeHint(row),
      transactionType: resolveTransactionType({
        row,
        catalogDisplayNameByCodeKey,
      }),
      bookingDate: formatDate(row.bookingDate),
      valueDate: row.valueDate ? formatDate(row.valueDate) : null,
      runningBalance: null,
    }));

    const stackOrder: string[] = []
    const seenStackIds = new Set<string>()
    for (const row of payload) {
      const stackId = String(row.topStackId ?? row.id)
      if (seenStackIds.has(stackId)) continue
      seenStackIds.add(stackId)
      stackOrder.push(stackId)
    }

    const totalTopTransactions = stackOrder.length
    const pageStackIds = new Set(stackOrder.slice(offset, offset + pageSize))
    const pagedRows = payload.filter((row) => pageStackIds.has(String(row.topStackId ?? row.id)))

    setHeader(event, "X-Data-Source", "db");
    return {
      rows: pagedRows,
      total: totalTopTransactions,
      totalTopTransactions,
      page,
      pageSize,
    };
  }

  const accountFilterSql = accountIds.length
    ? sql` AND t.account IN (${sql.join(accountIds.map((id) => sql`${id}`), sql`, `)})`
    : sql``;

  const searchFilterSql = like
    ? sql` AND (
        id::text ILIKE ${like} ESCAPE '\\'
        OR "runId"::text ILIKE ${like} ESCAPE '\\'
        OR COALESCE("bankAccountName", '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE("accountId"::text, '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE(amount::text, '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE(currency, '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE("creditDebitIndicator", '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE(status, '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE("processingStatus", '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE("ruleApplied", '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE("bkTxCdProprietary", '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE("bkTxCdDomain", '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE("bkTxCdFamily", '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE("bkTxCdSubFamily", '') ILIKE ${like} ESCAPE '\\'

        OR COALESCE("debtorName", '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE("debtorId", '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE("debtorAccountIban", '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE("creditorName", '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE("creditorId", '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE("creditorAccountIban", '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE("ultimateDebtorName", '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE("ultimateCreditorName", '') ILIKE ${like} ESCAPE '\\'

        OR COALESCE("remittanceCreditorReference", '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE("entryAdditionalInfo", '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE("txAdditionalInfo", '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE(array_to_string("remittanceUstrd", ' '), '') ILIKE ${like} ESCAPE '\\'
        OR COALESCE(array_to_string("remittanceAdditional", ' '), '') ILIKE ${like} ESCAPE '\\'
      )`
    : sql``

  // Compute running balance based on statement opening balance (OPBD) + bank sequential order.
  // Important: we compute the window over ALL entries in the relevant statements, and only
  // filter by date range in the outer query. This preserves correct saldo even when the user
  // views a partial date range of a statement.
  const rows = await db.execute(sql`
    WITH relevant_statements AS (
      SELECT DISTINCT t.statement_id
      FROM "transaction" t
      WHERE t.statement_id IS NOT NULL
        AND t.booking_date >= ${start}
        AND t.booking_date <= ${end}
        ${accountFilterSql}
    ),
    base AS (
      SELECT
        t.id,
        t.run_id AS "runId",
        t.account AS "accountId",
        a.name AS "bankAccountName",
        a.provider AS "bankProvider",

        t.statement_id AS "statementId",
        t.entry_index AS "entryIndex",
        t.entry_sub_index AS "entrySubIndex",

        t.amount,
        t.currency,
        t.credit_debit_indicator AS "creditDebitIndicator",
        t.status,
        t.booking_date AS "bookingDate",
        t.value_date AS "valueDate",

        t.ntry_ref AS "ntryRef",
        t.ntry_acct_svcr_ref AS "ntryAcctSvcrRef",
        t.entry_additional_info AS "entryAdditionalInfo",

        t.tx_acct_svcr_ref AS "txAcctSvcrRef",
        t.refs_end_to_end_id AS "refsEndToEndId",
        t.refs_instr_id AS "refsInstrId",
        t.refs_pmt_inf_id AS "refsPmtInfId",
        t.uetr,
        t.tx_additional_info AS "txAdditionalInfo",

        t.bk_tx_cd_domain AS "bkTxCdDomain",
        t.bk_tx_cd_family AS "bkTxCdFamily",
        t.bk_tx_cd_sub_family AS "bkTxCdSubFamily",
        t.bk_tx_cd_proprietary AS "bkTxCdProprietary",

        t.dbtr_name AS "debtorName",
        t.dbtr_id AS "debtorId",
        t.dbtr_acct_iban AS "debtorAccountIban",
        t.cdtr_name AS "creditorName",
        t.cdtr_id AS "creditorId",
        t.cdtr_acct_iban AS "creditorAccountIban",
        t.ultmt_dbtr_name AS "ultimateDebtorName",
        t.ultmt_cdtr_name AS "ultimateCreditorName",

        t.rmt_ustrd AS "remittanceUstrd",
        t.rmt_cdtr_ref AS "remittanceCreditorReference",
        t.rmt_addtl AS "remittanceAdditional",

        tp.status AS "processingStatus",
        tp.rule_applied AS "ruleApplied",

        s.statement_created_at AS "statementCreatedAt",
        s.electronic_seq_no AS "statementElectronicSeqNo",
        s.legal_seq_no AS "statementLegalSeqNo",

        CASE
          WHEN ob.amount IS NULL THEN NULL
          WHEN ob.credit_debit_indicator = 'DBIT' THEN -ob.amount
          ELSE ob.amount
        END AS opening_balance_signed,

        CASE
          WHEN t.credit_debit_indicator = 'DBIT' THEN -t.amount
          ELSE t.amount
        END AS signed_amount
      FROM "transaction" t
      LEFT JOIN transaction_processing tp ON tp.transaction_id = t.id
      LEFT JOIN account a ON a.id = t.account
      LEFT JOIN banking_statement s ON s.id = t.statement_id
      LEFT JOIN banking_statement_balance ob ON ob.statement_id = t.statement_id AND ob.type_code = 'OPBD'
      WHERE
        (
          t.statement_id IN (SELECT statement_id FROM relevant_statements)
          OR (t.statement_id IS NULL AND t.booking_date >= ${start} AND t.booking_date <= ${end}${accountFilterSql})
        )
        ${accountFilterSql}
    ),
    with_running AS (
      SELECT
        base.*,
        CASE
          WHEN base."statementId" IS NULL OR base."entryIndex" IS NULL OR base.opening_balance_signed IS NULL THEN NULL
          ELSE base.opening_balance_signed
            + SUM(base.signed_amount) OVER (
              PARTITION BY base."statementId"
              ORDER BY base."entryIndex", COALESCE(base."entrySubIndex", 1)
              ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            )
        END AS "runningBalance"
      FROM base
    )
    SELECT
      id,
      "runId",
      "accountId",
      "bankAccountName",
      "bankProvider",

      "statementId",
      "entryIndex",
      "entrySubIndex",

      amount,
      currency,
      "creditDebitIndicator",
      status,
      "bookingDate",
      "valueDate",

      "ntryRef",
      "ntryAcctSvcrRef",
      "entryAdditionalInfo",

      "txAcctSvcrRef",
      "refsEndToEndId",
      "refsInstrId",
      "refsPmtInfId",
      uetr,
      "txAdditionalInfo",

      "bkTxCdDomain",
      "bkTxCdFamily",
      "bkTxCdSubFamily",
      "bkTxCdProprietary",

      "debtorName",
      "debtorId",
      "debtorAccountIban",
      "creditorName",
      "creditorId",
      "creditorAccountIban",
      "ultimateDebtorName",
      "ultimateCreditorName",

      "remittanceUstrd",
      "remittanceCreditorReference",
      "remittanceAdditional",

      "processingStatus",
      "ruleApplied",
      "runningBalance"
    FROM with_running
    WHERE "bookingDate" >= ${start} AND "bookingDate" <= ${end}
      ${searchFilterSql}
    ORDER BY
      COALESCE("statementCreatedAt", "bookingDate"::timestamp) DESC,
      COALESCE("statementElectronicSeqNo", -1) DESC,
      COALESCE("statementLegalSeqNo", -1) DESC,
      COALESCE("entryIndex", 0) DESC,
      COALESCE("entrySubIndex", 1) DESC,
      "bookingDate" DESC,
      id DESC
  `);

  const catalogDisplayNameByCodeKey = await loadTransactionTypeCatalogDisplayNames(rows.rows as TransactionTypeRow[])

  const payload: StatementTransaction[] = rows.rows.map((row: any) => ({
    ...row,
    topStackId: toTopTransactionStackId({
      id: row.id,
      accountId: row.accountId,
      bookingDate: row.bookingDate,
      creditDebitIndicator: row.creditDebitIndicator,
      ntryRef: row.ntryRef,
      entryAdditionalInfo: row.entryAdditionalInfo,
      ntryAcctSvcrRef: row.ntryAcctSvcrRef,
    }),
    transactionTypeCode: buildTransactionCodeKey(row),
    transactionTypeHint: resolveTransactionTypeHint(row),
    transactionType: resolveTransactionType({
      row,
      catalogDisplayNameByCodeKey,
    }),
    bookingDate: formatDate(row.bookingDate),
    valueDate: row.valueDate ? formatDate(row.valueDate) : null,
    runningBalance: row.runningBalance ?? null,
  }));

  const stackOrder: string[] = []
  const seenStackIds = new Set<string>()
  for (const row of payload) {
    const stackId = String(row.topStackId ?? row.id)
    if (seenStackIds.has(stackId)) continue
    seenStackIds.add(stackId)
    stackOrder.push(stackId)
  }

  const totalTopTransactions = stackOrder.length
  const pageStackIds = new Set(stackOrder.slice(offset, offset + pageSize))
  const pagedRows = payload.filter((row) => pageStackIds.has(String(row.topStackId ?? row.id)))

  setHeader(event, "X-Data-Source", "db");
  return {
    rows: pagedRows,
    total: totalTopTransactions,
    totalTopTransactions,
    page,
    pageSize,
  };
});
