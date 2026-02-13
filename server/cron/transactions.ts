import { defineNitroTask } from 'nitropack';
import { runTransactionBatch } from '~/services/transactions/transactionService';

// Kører hver dag kl. 03:00
defineNitroTask('bank-transactions-batch', '0 3 * * *', async () => {
  try {
    console.log('[CRON] Starter bank-transaktion batch');
    const count = await runTransactionBatch();
    console.log(`[CRON] Batch færdig. ${count} transaktioner indsat`);
  } catch (err) {
    console.error('[CRON] Fejl under batch:', err);
  }
});
