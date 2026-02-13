import type { TransactionInsertSchema } from '~/lib/db/schema/index'

export function mapBankEntryToTransaction(
  entry: object,
  runBookingDate: number,
  bankAccountId: string,
  bankAccountName: string
): TransactionInsertSchema {

  const debtorReference = entry.debtorMessage ? entry.debtorMessage : entry.debtorText;
  const creditorReference = entry.creditorMessage ? entry.creditorMessage : entry.creditorText;

  // Saml references
  const references: string[] = [];
  if (debtorReference) references.push(debtorReference);
  if (creditorReference) references.push(creditorReference)
  if (entry.primaryReference) references.push(entry.primaryReference);

  const altIds: string[] = [];
  if (entry.debtorsPaymentId) ids.push(debtorsPaymentId);
  if (entry.endToEndId) ids.push(entry.endToEndId);
  if (entry.batch) ids.push(entry.batch);

  return {
    id: entry.id ?? crypto.randomUUID(),
    bookingDate: runBookingDate,
    bankAccount: bankAccountId,
    bankAccountName: bankAccountName ?? name,
    amount: parseFloat(entry.amount),
    transactionType: entry.type ?? 'Unknown',
    counterpartId: parseFloat(entry.amount) < 0 ? entry.creditor.id : entry.debtor.id,
    counterpartName: parseFloat(entry.amount) < 0 ? entry.creditor.name : entry.debtor.name,
    references,
    alternativeIds: altIds,
    ruleApplied: null,
    status: 'åben',
  };
}