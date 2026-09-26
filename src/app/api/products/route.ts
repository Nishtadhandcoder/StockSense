/**
 * Products API — Backend Lead
 * GET  /api/products  → list all products (supports ?category=&search=&lowStock=true)
 * POST /api/products  → create a new product
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ── GET /api/products ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category  = searchParams.get('category');
    const search    = searchParams.get('search');
    const lowStock  = searchParams.get('lowStock') === 'true';

    const products = await prisma.product.findMany({
      where: {
        ...(category ? { category }              : {}),
        ...(search   ? {
          OR: [
            { name: { contains: search } },
            { sku:  { contains: search } },
          ],
        } : {}),
      },
      include: {
        quants: {
          include: { location: { include: { warehouse: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute total stock per product from all internal locations
    const enriched = products.map((p) => {
      const totalQty = p.quants
        .filter((q) => q.location.isInternal)
        .reduce((sum, q) => sum + q.quantity, 0);

      return {
        id:              p.id,
        name:            p.name,
        sku:             p.sku,
        category:        p.category,
        uom:             p.uom,
        minReorderLevel: p.minReorderLevel,
        createdAt:       p.createdAt,
        updatedAt:       p.updatedAt,
        totalStock:      totalQty,
        isLowStock:      totalQty <= p.minReorderLevel,
        stockByLocation: p.quants
          .filter((q) => q.location.isInternal && q.quantity > 0)
          .map((q) => ({
            locationId:    q.locationId,
            locationName:  q.location.name,
            warehouseId:   q.location.warehouseId,
            warehouseName: q.location.warehouse?.name ?? null,
            quantity:      q.quantity,
          })),
      };
    });

    const result = lowStock
      ? enriched.filter((p) => p.isLowStock)
      : enriched;

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[GET /api/products]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// ── POST /api/products ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, sku, category, uom, minReorderLevel } = body;

    if (!name || !sku || !category) {
      return NextResponse.json(
        { success: false, error: 'name, sku, and category are required' },
        { status: 400 }
      );
    }

    // Check SKU uniqueness
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `SKU "${sku}" already exists` },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        category,
        uom:             uom             ?? 'Units',
        minReorderLevel: minReorderLevel ?? 0,
      },
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/products]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
