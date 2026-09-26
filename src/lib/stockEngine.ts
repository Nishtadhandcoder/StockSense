/**
 * StockEngine — Backend Lead core module
 * Handles all transactional inventory mutations:
 * - Receipt:    ADD qty to destLocation StockQuant
 * - Delivery:   SUBTRACT qty from sourceLocation StockQuant
 * - Internal:   SUBTRACT from source, ADD to dest
 * - Adjustment: SET absolute quantity (positive delta applied)
 *
 * All mutations run inside a Prisma $transaction to guarantee
 * atomic, consistent, isolated, and durable (ACID) operations.
 */

import { prisma } from '@/lib/prisma';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OperationType = 'RECEIPT' | 'DELIVERY' | 'INTERNAL' | 'ADJUSTMENT';
export type OperationStatus = 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED';

/** Status transition machine — defines valid next states from each status */
const VALID_TRANSITIONS: Record<OperationStatus, OperationStatus[]> = {
  DRAFT:    ['WAITING', 'CANCELED'],
  WAITING:  ['READY',   'CANCELED'],
  READY:    ['DONE',    'CANCELED'],
  DONE:     [],
  CANCELED: [],
};

// ─── Reference Number Generator ──────────────────────────────────────────────

/**
 * Generates a unique reference number like WH/IN/2026/0042
 * Counts existing operations of the same type to get sequence number.
 */
export async function generateReferenceNumber(type: OperationType): Promise<string> {
  const prefix =
    type === 'RECEIPT'    ? 'WH/IN'  :
    type === 'DELIVERY'   ? 'WH/OUT' :
    type === 'INTERNAL'   ? 'WH/INT' :
    /* ADJUSTMENT */        'WH/ADJ';

  const year = new Date().getFullYear();

  const count = await prisma.stockOperation.count({ where: { type } });
  const seq = String(count + 1).padStart(4, '0');

  return `${prefix}/${year}/${seq}`;
}

// ─── Validate Status Transition ───────────────────────────────────────────────

/**
 * Returns true if newStatus is a valid next state from currentStatus.
 */
export function isValidTransition(
  currentStatus: OperationStatus,
  newStatus: OperationStatus
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

// ─── Core: Validate Operation (Stock Engine Entry Point) ──────────────────────

/**
 * Validates an operation (transitions to DONE) and atomically:
 *  1. Checks stock sufficiency for outgoing moves
 *  2. Upserts StockQuant records per product/location
 *  3. Writes a StockLedger entry for every move (full audit trail)
 *  4. Marks the operation as DONE
 *
 * Throws on insufficient stock or invalid transition.
 * Entire operation rolls back if any step fails.
 */
export async function validateOperation(operationId: string): Promise<{
  success: boolean;
  ledgerEntries: { id: string; productId: string; qty: number }[];
}> {
  // Load the full operation with moves
  const operation = await prisma.stockOperation.findUnique({
    where: { id: operationId },
    include: { moves: { include: { product: true } } },
  });

  if (!operation) {
    throw new Error(`Operation ${operationId} not found`);
  }

  const currentStatus = operation.status as OperationStatus;

  if (!isValidTransition(currentStatus, 'DONE')) {
    throw new Error(
      `Cannot validate operation in status "${currentStatus}". ` +
      `Valid transitions: ${VALID_TRANSITIONS[currentStatus].join(', ') || 'none'}`
    );
  }

  if (operation.moves.length === 0) {
    throw new Error('Cannot validate an operation with no stock moves.');
  }

  // Pre-flight: check stock sufficiency for DELIVERY and INTERNAL
  if (operation.type === 'DELIVERY' || operation.type === 'INTERNAL') {
    if (!operation.sourceLocationId) {
      throw new Error('Source location is required for DELIVERY and INTERNAL operations.');
    }
    for (const move of operation.moves) {
      const quant = await prisma.stockQuant.findUnique({
        where: {
          productId_locationId: {
            productId: move.productId,
            locationId: operation.sourceLocationId,
          },
        },
      });
      const available = quant?.quantity ?? 0;
      if (available < move.qty) {
        throw new Error(
          `Insufficient stock for "${move.product.name}" (${move.product.sku}). ` +
          `Available: ${available}, Required: ${move.qty}`
        );
      }
    }
  }

  // ── Atomic Transaction ──────────────────────────────────────────────────────
  const ledgerEntries = await prisma.$transaction(async (tx) => {
    const entries: { id: string; productId: string; qty: number }[] = [];

    for (const move of operation.moves) {
      // ── Source decrement ──────────────────────────────────────────────────
      if (
        operation.sourceLocationId &&
        (operation.type === 'DELIVERY' || operation.type === 'INTERNAL')
      ) {
        await tx.stockQuant.upsert({
          where: {
            productId_locationId: {
              productId: move.productId,
              locationId: operation.sourceLocationId,
            },
          },
          create: {
            productId: move.productId,
            locationId: operation.sourceLocationId,
            quantity: 0, // Edge case: should not happen after pre-flight check
          },
          update: {
            quantity: { decrement: move.qty },
          },
        });
      }

      // ── Destination increment ─────────────────────────────────────────────
      if (
        operation.destLocationId &&
        (operation.type === 'RECEIPT' || operation.type === 'INTERNAL')
      ) {
        await tx.stockQuant.upsert({
          where: {
            productId_locationId: {
              productId: move.productId,
              locationId: operation.destLocationId,
            },
          },
          create: {
            productId: move.productId,
            locationId: operation.destLocationId,
            quantity: move.qty,
          },
          update: {
            quantity: { increment: move.qty },
          },
        });
      }

      // ── Adjustment: absolute delta applied to dest ────────────────────────
      if (operation.type === 'ADJUSTMENT' && operation.destLocationId) {
        await tx.stockQuant.upsert({
          where: {
            productId_locationId: {
              productId: move.productId,
              locationId: operation.destLocationId,
            },
          },
          create: {
            productId: move.productId,
            locationId: operation.destLocationId,
            quantity: move.qty,
          },
          update: {
            quantity: { increment: move.qty },
          },
        });
      }

      // ── Write StockLedger entry (immutable audit record) ──────────────────
      const ledgerEntry = await tx.stockLedger.create({
        data: {
          productId:        move.productId,
          sourceLocationId: operation.sourceLocationId ?? null,
          destLocationId:   operation.destLocationId   ?? null,
          qty:              move.qty,
          operationId:      operation.id,
          timestamp:        new Date(),
        },
      });

      entries.push({ id: ledgerEntry.id, productId: move.productId, qty: move.qty });
    }

    // ── Mark operation DONE ────────────────────────────────────────────────
    await tx.stockOperation.update({
      where: { id: operationId },
      data:  { status: 'DONE' },
    });

    return entries;
  });

  return { success: true, ledgerEntries };
}

// ─── Transition Operation Status ──────────────────────────────────────────────

/**
 * Transitions an operation's status (DRAFT→WAITING→READY or →CANCELED).
 * Does NOT apply inventory mutations — use validateOperation() for DONE.
 */
export async function transitionOperationStatus(
  operationId: string,
  newStatus: Exclude<OperationStatus, 'DONE'>
): Promise<{ id: string; status: string }> {
  const operation = await prisma.stockOperation.findUnique({
    where: { id: operationId },
    select: { id: true, status: true },
  });

  if (!operation) {
    throw new Error(`Operation ${operationId} not found`);
  }

  const currentStatus = operation.status as OperationStatus;

  if (!isValidTransition(currentStatus, newStatus)) {
    throw new Error(
      `Invalid transition: "${currentStatus}" → "${newStatus}". ` +
      `Allowed: ${VALID_TRANSITIONS[currentStatus].join(', ') || 'none'}`
    );
  }

  const updated = await prisma.stockOperation.update({
    where: { id: operationId },
    data:  { status: newStatus },
    select: { id: true, status: true },
  });

  return updated;
}
