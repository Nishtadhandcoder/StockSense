/**
 * Product [id] API — Backend Lead
 * GET    /api/products/[id]  → get single product with full stock snapshot
 * PUT    /api/products/[id]  → update product fields
 * DELETE /api/products/[id]  → delete product (blocks if stock > 0)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// ── GET /api/products/[id] ────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        quants: {
          include: { location: { include: { warehouse: true } } },
        },
        ledgerEntries: {
          orderBy: { timestamp: 'desc' },
          take: 10,
          include: {
            sourceLocation: true,
            destLocation:   true,
            operation:      { select: { type: true, status: true } },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const totalStock = product.quants
      .filter((q) => q.location.isInternal)
      .reduce((sum, q) => sum + q.quantity, 0);

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        totalStock,
        isLowStock: totalStock <= product.minReorderLevel,
      },
    });
  } catch (error) {
    console.error('[GET /api/products/[id]]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// ── PUT /api/products/[id] ────────────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, sku, category, uom, minReorderLevel } = body;

    // If SKU is changing, ensure it's still unique
    if (sku) {
      const conflict = await prisma.product.findFirst({
        where: { sku, id: { not: id } },
      });
      if (conflict) {
        return NextResponse.json(
          { success: false, error: `SKU "${sku}" is already used by another product` },
          { status: 409 }
        );
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name             != null ? { name }             : {}),
        ...(sku              != null ? { sku }              : {}),
        ...(category         != null ? { category }         : {}),
        ...(uom              != null ? { uom }              : {}),
        ...(minReorderLevel  != null ? { minReorderLevel }  : {}),
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    console.error('[PUT /api/products/[id]]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// ── DELETE /api/products/[id] ─────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Block deletion if product has active stock
    const quants = await prisma.stockQuant.findMany({ where: { productId: id } });
    const totalQty = quants.reduce((sum, q) => sum + q.quantity, 0);
    if (totalQty > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete: product still has ${totalQty} units in stock` },
        { status: 409 }
      );
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    console.error('[DELETE /api/products/[id]]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
