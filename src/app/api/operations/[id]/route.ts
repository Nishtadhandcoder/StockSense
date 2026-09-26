/**
 * Operation [id] API — Backend Lead
 * GET /api/operations/[id] → full operation with moves, locations, ledger entries
 * PUT /api/operations/[id] → update draft fields (only if status is DRAFT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// ── GET /api/operations/[id] ──────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const operation = await prisma.stockOperation.findUnique({
      where: { id },
      include: {
        sourceLocation: { include: { warehouse: true } },
        destLocation:   { include: { warehouse: true } },
        moves: {
          include: { product: true },
          orderBy: { createdAt: 'asc' },
        },
        ledgerEntries: {
          orderBy: { timestamp: 'desc' },
          include: {
            product:        { select: { name: true, sku: true } },
            sourceLocation: { select: { name: true } },
            destLocation:   { select: { name: true } },
          },
        },
      },
    });

    if (!operation) {
      return NextResponse.json(
        { success: false, error: 'Operation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: operation });
  } catch (error) {
    console.error('[GET /api/operations/[id]]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch operation' },
      { status: 500 }
    );
  }
}

// ── PUT /api/operations/[id] ──────────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Verify operation exists and is still DRAFT (editable)
    const existing = await prisma.stockOperation.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Operation not found' },
        { status: 404 }
      );
    }

    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        { success: false, error: `Only DRAFT operations can be edited. Current status: ${existing.status}` },
        { status: 409 }
      );
    }

    const { sourceLocationId, destLocationId, notes, scheduledDate, moves } = body;

    // Atomic update: operation fields + replace moves if provided
    const operation = await prisma.$transaction(async (tx) => {
      // Update header fields
      const updated = await tx.stockOperation.update({
        where: { id },
        data: {
          ...(sourceLocationId !== undefined ? { sourceLocationId } : {}),
          ...(destLocationId   !== undefined ? { destLocationId }   : {}),
          ...(notes            !== undefined ? { notes }            : {}),
          ...(scheduledDate    !== undefined ? { scheduledDate: new Date(scheduledDate) } : {}),
        },
      });

      // If moves are provided, replace them entirely
      if (moves && Array.isArray(moves)) {
        await tx.stockMove.deleteMany({ where: { operationId: id } });
        for (const m of moves as { productId: string; qty: number }[]) {
          await tx.stockMove.create({
            data: { operationId: id, productId: m.productId, qty: m.qty },
          });
        }
      }

      return updated;
    });

    // Return fresh full object
    const full = await prisma.stockOperation.findUnique({
      where: { id: operation.id },
      include: {
        sourceLocation: true,
        destLocation:   true,
        moves: { include: { product: true } },
      },
    });

    return NextResponse.json({ success: true, data: full });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Operation not found' },
        { status: 404 }
      );
    }
    console.error('[PUT /api/operations/[id]]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update operation' },
      { status: 500 }
    );
  }
}
