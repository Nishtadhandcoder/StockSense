/**
 * Locations API — Backend Lead
 * GET  /api/locations              → list all locations (filter: ?warehouseId=&isInternal=)
 * POST /api/locations              → create a location
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ── GET /api/locations ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId');
    const isInternalParam = searchParams.get('isInternal');

    const locations = await prisma.location.findMany({
      where: {
        ...(warehouseId     ? { warehouseId }               : {}),
        ...(isInternalParam !== null
          ? { isInternal: isInternalParam === 'true' }
          : {}),
      },
      include: {
        warehouse: true,
        quants: {
          include: { product: true },
        },
      },
      orderBy: [{ isInternal: 'desc' }, { name: 'asc' }],
    });

    const enriched = locations.map((loc) => ({
      id:           loc.id,
      name:         loc.name,
      warehouseId:  loc.warehouseId,
      warehouse:    loc.warehouse
        ? { id: loc.warehouse.id, name: loc.warehouse.name, code: loc.warehouse.code }
        : null,
      isInternal:   loc.isInternal,
      createdAt:    loc.createdAt,
      updatedAt:    loc.updatedAt,
      totalStock:   loc.quants.reduce((sum, q) => sum + q.quantity, 0),
      productCount: new Set(loc.quants.filter((q) => q.quantity > 0).map((q) => q.productId)).size,
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error('[GET /api/locations]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

// ── POST /api/locations ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { name, warehouseId, isInternal } = await req.json();

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'name is required' },
        { status: 400 }
      );
    }

    // If warehouseId provided, verify it exists
    if (warehouseId) {
      const wh = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
      if (!wh) {
        return NextResponse.json(
          { success: false, error: `Warehouse ${warehouseId} not found` },
          { status: 404 }
        );
      }
    }

    const location = await prisma.location.create({
      data: {
        name,
        warehouseId: warehouseId ?? null,
        isInternal:  isInternal  ?? true,
      },
      include: { warehouse: true },
    });

    return NextResponse.json({ success: true, data: location }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/locations]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create location' },
      { status: 500 }
    );
  }
}
