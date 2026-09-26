/**
 * Warehouse [id] API — Backend Lead
 * GET    /api/warehouses/[id]  → warehouse with locations + stock snapshot
 * PUT    /api/warehouses/[id]  → update name/code
 * DELETE /api/warehouses/[id]  → delete (blocked if locations have stock)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        locations: {
          include: {
            quants: { include: { product: true } },
          },
        },
      },
    });

    if (!warehouse) {
      return NextResponse.json({ success: false, error: 'Warehouse not found' }, { status: 404 });
    }

    const totalStock = warehouse.locations
      .flatMap((l) => l.quants)
      .reduce((sum, q) => sum + q.quantity, 0);

    return NextResponse.json({
      success: true,
      data: { ...warehouse, totalStock },
    });
  } catch (error) {
    console.error('[GET /api/warehouses/[id]]', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch warehouse' }, { status: 500 });
  }
}

// ── PUT ───────────────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { name, code } = await req.json();

    if (code) {
      const conflict = await prisma.warehouse.findFirst({ where: { code, id: { not: id } } });
      if (conflict) {
        return NextResponse.json(
          { success: false, error: `Code "${code}" is already used by another warehouse` },
          { status: 409 }
        );
      }
    }

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(code ? { code } : {}),
      },
    });

    return NextResponse.json({ success: true, data: warehouse });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Warehouse not found' }, { status: 404 });
    }
    console.error('[PUT /api/warehouses/[id]]', error);
    return NextResponse.json({ success: false, error: 'Failed to update warehouse' }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: { locations: { include: { quants: true } } },
    });

    if (!warehouse) {
      return NextResponse.json({ success: false, error: 'Warehouse not found' }, { status: 404 });
    }

    const totalStock = warehouse.locations
      .flatMap((l) => l.quants)
      .reduce((sum, q) => sum + q.quantity, 0);

    if (totalStock > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete: warehouse still holds ${totalStock} units of stock` },
        { status: 409 }
      );
    }

    await prisma.warehouse.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Warehouse deleted successfully' });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Warehouse not found' }, { status: 404 });
    }
    console.error('[DELETE /api/warehouses/[id]]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete warehouse' }, { status: 500 });
  }
}
