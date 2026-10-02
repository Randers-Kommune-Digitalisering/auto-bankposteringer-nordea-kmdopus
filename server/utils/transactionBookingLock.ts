import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import { createError } from 'h3'
import db from '~/lib/db'
import { transaction, transactionProcessing } from '~/lib/db/schema/transaction'
import type { LockOwnerIdentity } from '~~/server/auth/requireAppRoles'
import { buildNordeaDeterministicGroupKey } from '#engine/banking-ingestion/handlers/camt053/nordeaAdditionalEntryInfo'
import { MANUAL_BOOKING_LOCK_LEASE_MS } from '#engine/manual-booking/domain/bookingLease'

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export type BookingLockCandidate = {
  id: string
  accountId: string
  bookingDate: Date
  creditDebitIndicator: string | null
  statementId: string | null
  entryIndex: number | null
  ntryRef: string | null
  ntryAcctSvcrRef: string | null
  entryAdditionalInfo: string | null
  processingStatus: string | null
}

export type BookingLockScope = {
  allTransactionIds: string[]
  openTransactionIds: string[]
}

type LockRow = {
  transactionId: string
  status: string | null
  lockedAt: Date | null
  lockedBy: string | null
  lockedByName: string | null
}

function statementEntryKey(statementId: string | null, entryIndex: number | null): string | null {
  if (!statementId || !Number.isInteger(entryIndex) || Number(entryIndex) < 1) return null
  return `${statementId}:${entryIndex}`
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

export function resolveBookingLockScope(
  anchorTransactionId: string,
  candidates: BookingLockCandidate[],
): BookingLockScope {
  const entryGroupSizes = new Map<string, number>()
  for (const candidate of candidates) {
    const entryKey = statementEntryKey(candidate.statementId, candidate.entryIndex)
    if (entryKey) entryGroupSizes.set(entryKey, (entryGroupSizes.get(entryKey) ?? 0) + 1)
  }

  const keyFor = (candidate: BookingLockCandidate) => buildNordeaDeterministicGroupKey({
    accountId: candidate.accountId,
    bookingDate: toDate(candidate.bookingDate),
    creditDebitIndicator: candidate.creditDebitIndicator,
    entryGroupSize: entryGroupSizes.get(statementEntryKey(candidate.statementId, candidate.entryIndex) ?? '') ?? 0,
    ntryRef: candidate.ntryRef,
    entryAdditionalInfo: candidate.entryAdditionalInfo,
    ntryAcctSvcrRef: candidate.ntryAcctSvcrRef,
  })

  const anchorCandidate = candidates.find(candidate => candidate.id === anchorTransactionId)
  const groupKey = anchorCandidate ? keyFor(anchorCandidate) : null
  const members = groupKey
    ? candidates.filter(candidate => keyFor(candidate) === groupKey)
    : candidates.filter(candidate => candidate.id === anchorTransactionId)
  const allTransactionIds = members.map(candidate => candidate.id).sort()
  const openTransactionIds = members
    .filter(candidate => !candidate.processingStatus || candidate.processingStatus === 'åben')
    .map(candidate => candidate.id)
    .sort()

  return { allTransactionIds, openTransactionIds }
}

async function resolveScope(executor: DbTransaction, anchorTransactionId: string): Promise<BookingLockScope> {
  const [anchor] = await executor
    .select({
      id: transaction.id,
      accountId: transaction.accountId,
      bookingDate: transaction.bookingDate,
      creditDebitIndicator: transaction.creditDebitIndicator,
    })
    .from(transaction)
    .where(eq(transaction.id, anchorTransactionId))
    .limit(1)

  if (!anchor) {
    throw createError({ statusCode: 404, statusMessage: 'Transaktionen blev ikke fundet' })
  }

  const directionCondition = anchor.creditDebitIndicator === null
    ? isNull(transaction.creditDebitIndicator)
    : eq(transaction.creditDebitIndicator, anchor.creditDebitIndicator)

  const candidates = await executor
    .select({
      id: transaction.id,
      accountId: transaction.accountId,
      bookingDate: transaction.bookingDate,
      creditDebitIndicator: transaction.creditDebitIndicator,
      statementId: transaction.statementId,
      entryIndex: transaction.entryIndex,
      ntryRef: transaction.ntryRef,
      ntryAcctSvcrRef: transaction.ntryAcctSvcrRef,
      entryAdditionalInfo: transaction.entryAdditionalInfo,
      processingStatus: transactionProcessing.status,
    })
    .from(transaction)
    .leftJoin(transactionProcessing, eq(transactionProcessing.transactionId, transaction.id))
    .where(and(
      eq(transaction.accountId, anchor.accountId),
      eq(transaction.bookingDate, anchor.bookingDate),
      directionCondition,
    )) as BookingLockCandidate[]

  return resolveBookingLockScope(anchorTransactionId, candidates)
}

async function lockProcessingRows(tx: DbTransaction, transactionIds: string[]): Promise<LockRow[]> {
  await tx
    .insert(transactionProcessing)
    .values(transactionIds.map(transactionId => ({ transactionId })))
    .onConflictDoNothing()

  return tx
    .select({
      transactionId: transactionProcessing.transactionId,
      status: transactionProcessing.status,
      lockedAt: transactionProcessing.lockedAt,
      lockedBy: transactionProcessing.lockedBy,
      lockedByName: transactionProcessing.lockedByName,
    })
    .from(transactionProcessing)
    .where(inArray(transactionProcessing.transactionId, transactionIds))
    .orderBy(asc(transactionProcessing.transactionId))
    .for('update')
}

function isLiveLock(row: LockRow, now: Date): boolean {
  return Boolean(row.lockedBy && row.lockedAt && now.getTime() - row.lockedAt.getTime() < MANUAL_BOOKING_LOCK_LEASE_MS)
}

export async function acquireTransactionBookingLock(
  anchorTransactionId: string,
  user: LockOwnerIdentity,
  renewOnly = false,
) {
  return db.transaction(async (tx) => {
    const scope = await resolveScope(tx, anchorTransactionId)
    if (!scope.openTransactionIds.length) {
      throw createError({ statusCode: 409, message: 'Transaktionen er ikke længere åben' })
    }

    const rows = await lockProcessingRows(tx, scope.openTransactionIds)
    const currentScope = await resolveScope(tx, anchorTransactionId)
    if (currentScope.openTransactionIds.length !== scope.openTransactionIds.length
      || currentScope.openTransactionIds.some((id, index) => id !== scope.openTransactionIds[index])
      || rows.some(row => row.status && row.status !== 'åben')) {
      throw createError({ statusCode: 409, message: 'Samlepostens åbne transaktioner har ændret sig' })
    }

    const now = new Date()
    const conflictingOwner = rows.find((row) => {
      if (!isLiveLock(row, now)) return false
      return row.lockedBy !== user.id
    })

    if (conflictingOwner) {
      return {
        acquired: false as const,
        ownerName: conflictingOwner.lockedByName || 'anden bruger',
      }
    }

    if (renewOnly && rows.some(row => row.lockedBy !== user.id || !isLiveLock(row, now))) {
      return { acquired: false as const, ownerName: 'anden bruger' }
    }

    await tx
      .update(transactionProcessing)
      .set({ lockedAt: now, lockedBy: user.id, lockedByName: user.displayName })
      .where(inArray(transactionProcessing.transactionId, scope.openTransactionIds))

    return {
      acquired: true as const,
      expiresAt: new Date(now.getTime() + MANUAL_BOOKING_LOCK_LEASE_MS).toISOString(),
    }
  })
}

export async function verifyTransactionBookingLockInTransaction(
  tx: DbTransaction,
  anchorTransactionId: string,
  user: LockOwnerIdentity,
  expectedTransactionIds?: string[],
): Promise<void> {
  const scope = await resolveScope(tx, anchorTransactionId)
  if (expectedTransactionIds) {
    const expected = [...new Set(expectedTransactionIds)].sort()
    if (expected.length !== scope.openTransactionIds.length
      || expected.some((id, index) => id !== scope.openTransactionIds[index])) {
      throw createError({ statusCode: 409, message: 'Samlepostens åbne transaktioner har ændret sig' })
    }
  }

  if (!scope.openTransactionIds.length) {
    throw createError({ statusCode: 409, message: 'Transaktionen er ikke længere åben' })
  }

  const rows = await lockProcessingRows(tx, scope.openTransactionIds)
  const currentScope = await resolveScope(tx, anchorTransactionId)
  if (currentScope.openTransactionIds.length !== scope.openTransactionIds.length
    || currentScope.openTransactionIds.some((id, index) => id !== scope.openTransactionIds[index])
    || rows.some(row => row.status && row.status !== 'åben')) {
    throw createError({ statusCode: 409, message: 'Samlepostens åbne transaktioner har ændret sig' })
  }

  const now = new Date()
  if (rows.some(row => row.lockedBy !== user.id || !isLiveLock(row, now))) {
    throw createError({ statusCode: 409, message: 'Bookinglåsen mangler eller er udløbet. Luk og åbn posten igen.' })
  }

  await tx
    .update(transactionProcessing)
    .set({ lockedAt: now, lockedByName: user.displayName })
    .where(inArray(transactionProcessing.transactionId, scope.openTransactionIds))
}

export async function verifyTransactionBookingLock(
  anchorTransactionId: string,
  user: LockOwnerIdentity,
  expectedTransactionIds?: string[],
): Promise<void> {
  await db.transaction(tx => verifyTransactionBookingLockInTransaction(
    tx,
    anchorTransactionId,
    user,
    expectedTransactionIds,
  ))
}

export async function releaseTransactionBookingLock(anchorTransactionId: string, user: LockOwnerIdentity) {
  return db.transaction(async (tx) => {
    const scope = await resolveScope(tx, anchorTransactionId)
    if (!scope.allTransactionIds.length) return { released: 0 }

    const released = await tx
      .update(transactionProcessing)
      .set({ lockedAt: null, lockedBy: null, lockedByName: null })
      .where(and(
        inArray(transactionProcessing.transactionId, scope.allTransactionIds),
        eq(transactionProcessing.lockedBy, user.id),
      ))
      .returning({ transactionId: transactionProcessing.transactionId })

    return { released: released.length }
  })
}