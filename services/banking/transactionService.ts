import { db } from '~/app/lib/db';
import { Run, Transaction } from '~/app/lib/db/index';
import { Transaction } from '~/lib/db/schema/transaction';
import { fetchBankTransactions } from './batchFetchTransactions';
import { mapBankEntryToTransaction } from './transactionMapping';

export async function runTransactionBatch() {
  // 1️⃣ Opret Run
  const runId = crypto.randomUUID();
  const bookingDate = Date.now();

  await db.insert(Run).values({
    id: runId,
    bookingDate,
    status: 'afventer',
    errors: [],
    transactions: [],
    docs: [],
    bankingRequests: [],
    bankingResponses: [],
    erpRequests: [],
    erpResponses: [],
  });

  // 2️⃣ Hent transaktioner fra bank API
  const rawTransactions = await fetchBankTransactions();

  // 3️⃣ Map til DB schema
  const mappedTransactions = rawTransactions.map((tx) =>
    mapBankEntryToTransaction(tx, bookingDate, tx.account ?? '', tx.accountName ?? '')
  );

  // 4️⃣ Indsæt i DB
  await db.insert(Transaction).values(mappedTransactions);

  // 5️⃣ Opdater Run med antal transaktioner
  await db
    .update(Run)
    .set({ status: 'udført', transactions: mappedTransactions.map((t) => t.id) })
    .where({ id: runId });

  return mappedTransactions.length;
}
