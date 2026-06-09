import { desc, eq, inArray, sql } from "drizzle-orm";
import { defineEventHandler, getQuery, setHeader } from "h3";
import db from "~/lib/db";
import { account } from "~/lib/db/schema/account";
import { transaction, transactionProcessing } from "~/lib/db/schema/transaction";
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
