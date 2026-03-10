import { and, eq } from 'drizzle-orm'
import { bankingAdapterCursor } from '~/lib/db/schema/bankingAdapterCursor'
import type { BankAdapterKey, BankCursor } from '../ports/bankAdapter'

type DbClient = {
  select: any
  insert: any
  update: any
}

export async function getAdapterCursor(
  db: DbClient,
  input: { accountId: string; adapterKey: BankAdapterKey },
): Promise<BankCursor | null> {
  const rows = await db
    .select({ cursor: bankingAdapterCursor.cursor })
    .from(bankingAdapterCursor)
    .where(
      and(
        eq(bankingAdapterCursor.accountId, input.accountId),
        eq(bankingAdapterCursor.adapterKey, input.adapterKey),
      ),
    )
    .limit(1)

  const row = rows[0] ?? null
  return row ? { value: row.cursor } : null
}

export async function setAdapterCursor(
  db: DbClient,
  input: { accountId: string; adapterKey: BankAdapterKey; cursor: BankCursor },
): Promise<void> {
  await db
    .insert(bankingAdapterCursor)
    .values({
      accountId: input.accountId,
      adapterKey: input.adapterKey,
      cursor: input.cursor.value,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [bankingAdapterCursor.accountId, bankingAdapterCursor.adapterKey],
      set: {
        cursor: input.cursor.value,
        updatedAt: new Date(),
      },
    })
}
