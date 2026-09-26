/**
 * Operations API — Backend Lead
 * GET  /api/operations   → list with rich filters (type, status, warehouseId, search, page)
 * POST /api/operations   → create new operation in DRAFT with moves
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateReferenceNumber } from '@/lib/stockEngine';
import type { OperationType } from '@/lib/stockEngine';

// ── GET /api/operations ───────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type        = searchParams.get('type');
    const status      = searchParams.get('status');
    const warehouseId = searchParams.get('warehouseId');
    const search      = searchParams.get('search');
    const page        = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit       = Math.min(100, parseInt(searchParams.get('limit') ?? '20'));

    // Build where clause
    const where: Record<string, unknown> = {};
    if (type   && type   !== 'ALL') where.type   = type;
    if (status && status !== 'ALL') where.status = status;

    // If filtering by warehouse, get locationIds that belong to that warehouse
    if (warehouseId && warehouseId !== 'ALL') {
      const locs = await prisma.location.findMany({
        where: { warehouseId },
        select: { id: true },
      });
      const locIds = locs.map((l) => l.id);
      where.OR = [
        { sourceLocationId: { in: locIds } },
        { destLocationId:   { in: locIds } },
      ];
    }

    // Reference number search
    if (search) {
      where.referenceNumber = { contains: search };
    }

    const [total, operations] = await Promise.all([
      prisma.stockOperation.count({ where }),
      prisma.stockOperation.findMany({
        where,
        include: {
          sourceLocation: { include: { warehouse: true } },
          destLocation:   { include: { warehouse: true } },
          moves: {
            include: { product: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip:  (page - 1) * limit,
        take:  limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: operations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[GET /api/operations]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch operations' },
      { status: 500 }
    );
  }
}

// ── POST /api/operations ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, sourceLocationId, destLocationId, notes, scheduledDate, moves } = body;

    // ── Validation ─────────────────────────────────────────────────────────
    if (!type || !['RECEIPT', 'DELIVERY', 'INTERNAL', 'ADJUSTMENT'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'type must be RECEIPT | DELIVERY | INTERNAL | ADJUSTMENT' },
        { status: 400 }
      );
    }

    if (!moves || !Array.isArray(moves) || moves.length === 0) {
      return NextResponse.json(
        { success: false, error: 'moves array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate each move
    for (const move of moves) {
      if (!move.productId || !move.qty || move.qty <= 0) {
        return NextResponse.json(
          { success: false, error: 'Each move requires productId and qty > 0' },
          { status: 400 }
        );
      }
    }

    // Verify all product IDs exist
    const productIds = moves.map((m: { productId: string }) => m.productId);
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });
    if (existingProducts.length !== productIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more product IDs are invalid' },
        { status: 400 }
      );
    }

    // Verify location IDs exist (if provided)
    if (sourceLocationId) {
      const srcLoc = await prisma.location.findUnique({ where: { id: sourceLocationId } });
      if (!srcLoc) {
        return NextResponse.json(
          { success: false, error: `Source location ${sourceLocationId} not found` },
          { status: 404 }
        );
      }
    }
    if (destLocationId) {
      const dstLoc = await prisma.location.findUnique({ where: { id: destLocationId } });
      if (!dstLoc) {
        return NextResponse.json(
          { success: false, error: `Destination location ${destLocationId} not found` },
          { status: 404 }
        );
      }
    }

    // Generate reference number
    const referenceNumber = await generateReferenceNumber(type as OperationType);

    // Create operation + moves atomically
    const operation = await prisma.stockOperation.create({
      data: {
        type,
        status:          'DRAFT',
        referenceNumber,
        sourceLocationId: sourceLocationId ?? null,
        destLocationId:   destLocationId   ?? null,
        notes:            notes            ?? '',
        scheduledDate:    scheduledDate ? new Date(scheduledDate) : new Date(),
        moves: {
          create: moves.map((m: { productId: string; qty: number }) => ({
            productId: m.productId,
            qty:       m.qty,
          })),
        },
      },
      include: {
        sourceLocation: true,
        destLocation:   true,
        moves: { include: { product: true } },
      },
    });

    return NextResponse.json({ success: true, data: operation }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/operations]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create operation' },
      { status: 500 }
    );
  }
}
