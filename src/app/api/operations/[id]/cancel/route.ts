/**
 * Cancel Operation — Backend Lead
 * POST /api/operations/[id]/cancel
 *
 * Transitions any non-DONE, non-CANCELED operation to CANCELED.
 * Once DONE, an operation cannot be canceled (requires a reversal operation).
 */

import { NextRequest, NextResponse } from 'next/server';
import { transitionOperationStatus } from '@/lib/stockEngine';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const operation = await prisma.stockOperation.findUnique({
      where: { id },
      select: { status: true, referenceNumber: true },
    });

    if (!operation) {
      return NextResponse.json(
        { success: false, error: 'Operation not found' },
        { status: 404 }
      );
    }

    if (operation.status === 'DONE') {
      return NextResponse.json(
        {
          success: false,
          error: 'A completed (DONE) operation cannot be canceled. Create a reversal operation instead.',
        },
        { status: 409 }
      );
    }

    if (operation.status === 'CANCELED') {
      return NextResponse.json(
        { success: false, error: 'Operation is already canceled.' },
        { status: 409 }
      );
    }

    const updated = await transitionOperationStatus(id, 'CANCELED');

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Operation ${operation.referenceNumber} has been canceled.`,
    });
  } catch (error: any) {
    console.error('[POST /api/operations/[id]/cancel]', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Failed to cancel operation' },
      { status: 500 }
    );
  }
}
