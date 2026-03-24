import { and, eq } from 'drizzle-orm'
import { bankingAgreementCursor } from '~/lib/db/schema/bankingAgreementCursor'
import type { BankAdapterKey, BankCursor } from '../ports/bankAdapter'
import type { BankProvider } from '~/lib/db/schema/bankingAgreement'

type DbClient = {
  select: any
  insert: any
  update: any
}

export async function getAgreementCursor(
  db: DbClient,
  input: { provider: BankProvider; adapterKey: BankAdapterKey },
): Promise<BankCursor | null> {
  const rows = await db
    .select({ cursor: bankingAgreementCursor.cursor })
    .from(bankingAgreementCursor)
    .where(
      and(
        eq(bankingAgreementCursor.provider, input.provider as any),
        eq(bankingAgreementCursor.adapterKey, input.adapterKey),
      ),
    )
    .limit(1)

  const row = rows[0] ?? null
  return row ? { value: row.cursor } : null
}

export async function setAgreementCursor(
  db: DbClient,
  input: { provider: BankProvider; adapterKey: BankAdapterKey; cursor: BankCursor },
): Promise<void> {
  await db
    .insert(bankingAgreementCursor)
    .values({
      provider: input.provider as any,
      adapterKey: input.adapterKey,
      cursor: input.cursor.value,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [bankingAgreementCursor.provider, bankingAgreementCursor.adapterKey],
      set: {
        cursor: input.cursor.value,
        updatedAt: new Date(),
      },
    })
}
