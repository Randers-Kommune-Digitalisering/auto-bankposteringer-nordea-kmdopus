import crypto from "crypto"
import db from '~/app/lib/db'
import { account } from '~/app/lib/db/schema'
import { bankingIntegrationMetadata, type BankingIntegrationMetadata } from "~/app/lib/env";

export async function getBankingMetaData() {
  return bankingIntegrationMetadata;
}

export interface SimpleAccountReportEntry {
  id?: string;
  sequence: number;
  amount: number;
  balance: number;
  instructedCurrency?: string;
  instructedAmount?: number;
  exchangeRate?: number;
  batch?: string;
  debtorBic?: string;
  debtorAccount?: string;
  debtorText?: string;
  debtorMessage?: string;
  creditorBic?: string;
  creditorAccount?: string;
  creditorText?: string;
  creditorMessage?: string;
  ocrReference?: string;
  ocrType?: string;
  easyAccount?: string;
  easyAccountType?: string;
  debtorsPaymentId?: string;
  primaryReference?: string;
  employeeNumber?: string;
  endToEndId?: string;
  date: { bookingDate: string; valueDate: string };
  type?: string;
  text?: string;
  transactionCodes?: Record<string, any>;
  debtor?: Record<string, any>;
  creditor?: Record<string, any>;
}

// Helper: lav HMAC godkendelse
export function generateAuthHeader(
  accountId: string,
  requestId: string,
  meta: BankingIntegrationMetadata,
) {
  const now = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const payload = `${accountId}#${requestId}#${meta.serviceProvider}#${now}`;
  const hmac = crypto
    .createHmac("sha256", meta.servicerProviderId)
    .update(payload)
    .digest("base64");

  const authObj = {
    serviceProvider: meta.serviceProvider,
    account: accountId,
    time: now,
    requestId,
    hash: [{ id: requestId, hash: hmac }],
  };

  return Buffer.from(JSON.stringify(authObj)).toString("base64");
}

// Hent kontoudtog for en konto med Nuxt useFetch
async function fetchTransactionsForAccount(
  accountId: string,
  meta: BankingIntegrationMetadata,
): Promise<SimpleAccountReportEntry[]> {
  const requestId = crypto.randomUUID();
  const authHeader = generateAuthHeader(accountId, requestId, meta);

  const response = await fetch(`https://api.bankintegration.dk/statement?account=${accountId}`, {
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(
      `Fejl ved hentning af kontoudtog for konto ${accountId}: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as SimpleAccountReportEntry[] | null;

  return data ?? [];
}

// Iterer over alle konti og hent transaktioner
export async function fetchBankTransactions(): Promise<SimpleAccountReportEntry[]> {
  const accounts = await db.select().from(account);
  const meta = await getBankingMetaData();
  const allTransactions: SimpleAccountReportEntry[] = [];

  for (const account of accounts) {
    try {
      const tx = await fetchTransactionsForAccount(account.id, meta);
      allTransactions.push(...tx);
    } catch (err) {
      console.error(`Fejl for konto ${account.id}:`, err);
    }
  }

  return allTransactions;
}
