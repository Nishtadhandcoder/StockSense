/**
 * Validate Operation — Backend Lead  ⭐ CRITICAL ENDPOINT
 * POST /api/operations/[id]/validate
 *
 * Calls the Stock Engine to atomically:
 *  - Mutate StockQuant (add/subtract/adjust per move)
 *  - Write immutable StockLedger entries
 *  - Set operation status to DONE
 *
 * Requires operation to be in READY status.
 * Rolls back entirely on any error (e.g., insufficient stock).
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateOperation } from '@/lib/stockEngine';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const result = await validateOperation(id);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Operation validated. ${result.ledgerEntries.length} ledger entries created.`,
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('[POST /api/operations/[id]/validate]', error);

    // Surface business logic errors (insufficient stock, bad state) as 409
    const isBusinessError =
      error?.message?.includes('Insufficient stock') ||
      error?.message?.includes('Cannot validate') ||
      error?.message?.includes('Invalid transition') ||
      error?.message?.includes('no stock moves');

    return NextResponse.json(
      { success: false, error: error?.message ?? 'Failed to validate operation' },
      { status: isBusinessError ? 409 : 500 }
    );
  }
}
