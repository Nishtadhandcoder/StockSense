/**
 * Location [id] API — Backend Lead
 * GET    /api/locations/[id]  → location with quants + recent ledger
 * PUT    /api/locations/[id]  → update name / isInternal
 * DELETE /api/locations/[id]  → delete (blocked if stock > 0)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        warehouse: true,
        quants: {
          include: { product: true },
          where: { quantity: { gt: 0 } },
          orderBy: { quantity: 'desc' },
        },
      },
    });

    if (!location) {
      return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 });
    }

    const totalStock = location.quants.reduce((sum, q) => sum + q.quantity, 0);

    return NextResponse.json({
      success: true,
      data: { ...location, totalStock },
    });
  } catch (error) {
    console.error('[GET /api/locations/[id]]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch location' }, { status: 500 });
  }
}

// ── PUT ───────────────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { name, isInternal, warehouseId } = await req.json();

    const location = await prisma.location.update({
      where: { id },
      data: {
        ...(name        != null ? { name }        : {}),
        ...(isInternal  != null ? { isInternal }  : {}),
        ...(warehouseId !== undefined ? { warehouseId: warehouseId ?? null } : {}),
      },
      include: { warehouse: true },
    });

    return NextResponse.json({ success: true, data: location });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 });
    }
    console.error('[PUT /api/locations/[id]]', error);
    return NextResponse.json({ success: false, error: 'Failed to update location' }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const quants = await prisma.stockQuant.findMany({ where: { locationId: id } });
    const totalQty = quants.reduce((sum, q) => sum + q.quantity, 0);

    if (totalQty > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete: location has ${totalQty} units of active stock` },
        { status: 409 }
      );
    }

    await prisma.location.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Location deleted successfully' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Location not found' }, { status: 404 });
    }
    console.error('[DELETE /api/locations/[id]]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete location' }, { status: 500 });
  }
}
