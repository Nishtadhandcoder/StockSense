/**
 * Confirm Operation — Backend Lead
 * POST /api/operations/[id]/confirm
 *
 * Advances status: DRAFT → WAITING → READY
 * Does NOT apply stock changes. Use /validate for DONE.
 */

import { NextRequest, NextResponse } from 'next/server';
import { transitionOperationStatus } from '@/lib/stockEngine';
import type { OperationStatus } from '@/lib/stockEngine';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const operation = await prisma.stockOperation.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!operation) {
      return NextResponse.json(
        { success: false, error: 'Operation not found' },
        { status: 404 }
      );
    }

    const currentStatus = operation.status as OperationStatus;

    // Determine next state in the confirm flow
    const nextStatus: OperationStatus | null =
      currentStatus === 'DRAFT'   ? 'WAITING' :
      currentStatus === 'WAITING' ? 'READY'   :
      null;

    if (!nextStatus) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot confirm operation in status "${currentStatus}". ` +
                 `Use /validate to finalize a READY operation.`,
        },
        { status: 409 }
      );
    }

    const updated = await transitionOperationStatus(id, nextStatus);

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Operation confirmed: ${currentStatus} → ${nextStatus}`,
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('[POST /api/operations/[id]/confirm]', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Failed to confirm operation' },
      { status: 500 }
    );
  }
}
