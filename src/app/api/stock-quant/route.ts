/**
 * Stock Quant API — Backend Lead
 * GET /api/stock-quant → current stock levels per product/location
 *
 * Query params:
 *   ?productId=  → filter by product
 *   ?locationId= → filter by location
 *   ?warehouseId=→ filter by warehouse (resolves via location.warehouseId)
 *   ?lowStock=true → only products at or below reorder level
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId   = searchParams.get('productId');
    const locationId  = searchParams.get('locationId');
    const warehouseId = searchParams.get('warehouseId');
    const lowStock    = searchParams.get('lowStock') === 'true';

    // Resolve warehouse → locationIds if needed
    let locationIds: string[] | undefined;
    if (warehouseId && warehouseId !== 'ALL') {
      const locs = await prisma.location.findMany({
        where: { warehouseId, isInternal: true },
        select: { id: true },
      });
      locationIds = locs.map((l) => l.id);
    }

    const quants = await prisma.stockQuant.findMany({
      where: {
        ...(productId   ? { productId }                              : {}),
        ...(locationId  ? { locationId }                             : {}),
        ...(locationIds ? { locationId: { in: locationIds } }        : {}),
        quantity: { gt: 0 }, // Only show locations with actual stock
      },
      include: {
        product:  true,
        location: { include: { warehouse: true } },
      },
      orderBy: [{ product: { name: 'asc' } }, { quantity: 'desc' }],
    });

    // Compute total per product to check low stock
    const productTotals = new Map<string, number>();
    quants.forEach((q) => {
      productTotals.set(q.productId, (productTotals.get(q.productId) ?? 0) + q.quantity);
    });

    const enriched = quants.map((q) => ({
      id:           q.id,
      productId:    q.productId,
      product: {
        id:              q.product.id,
        name:            q.product.name,
        sku:             q.product.sku,
        category:        q.product.category,
        uom:             q.product.uom,
        minReorderLevel: q.product.minReorderLevel,
      },
      locationId: q.locationId,
      location: {
        id:          q.location.id,
        name:        q.location.name,
        isInternal:  q.location.isInternal,
        warehouseId: q.location.warehouseId,
        warehouse:   q.location.warehouse
          ? { id: q.location.warehouse.id, name: q.location.warehouse.name, code: q.location.warehouse.code }
          : null,
      },
      quantity:    q.quantity,
      updatedAt:   q.updatedAt,
      isLowStock:  (productTotals.get(q.productId) ?? 0) <= q.product.minReorderLevel,
    }));

    const result = lowStock ? enriched.filter((q) => q.isLowStock) : enriched;

    return NextResponse.json({ success: true, data: result, count: result.length });
  } catch (error) {
    console.error('[GET /api/stock-quant]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock quant' },
      { status: 500 }
    );
  }
}
