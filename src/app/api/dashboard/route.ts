/**
 * Dashboard KPI API — Backend Lead
 * GET /api/dashboard → aggregated KPIs for the main dashboard
 *
 * Query params:
 *   ?warehouseId=  → filter all KPIs to a specific warehouse ('ALL' = global)
 *
 * Returns:
 *   - totalProductsCount
 *   - totalStockUnits      (sum of all internal location quants)
 *   - lowStockItems        (products at or below minReorderLevel)
 *   - pendingReceiptsCount
 *   - pendingDeliveriesCount
 *   - pendingTransfersCount
 *   - operationsSummary    (counts per type + status)
 *   - recentLedger         (last 5 entries)
 *   - topProducts          (top 5 by total stock qty)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId');
    const filterByWh  = warehouseId && warehouseId !== 'ALL';

    // ── Resolve location filter ─────────────────────────────────────────────
    let internalLocationIds: string[] | undefined;
    if (filterByWh) {
      const locs = await prisma.location.findMany({
        where: { warehouseId, isInternal: true },
        select: { id: true },
      });
      internalLocationIds = locs.map((l) => l.id);
    } else {
      const locs = await prisma.location.findMany({
        where: { isInternal: true },
        select: { id: true },
      });
      internalLocationIds = locs.map((l) => l.id);
    }

    // ── Run all queries in parallel ─────────────────────────────────────────
    const [
      totalProductsCount,
      quants,
      products,
      pendingReceipts,
      pendingDeliveries,
      pendingTransfers,
      operationStatusCounts,
      recentLedger,
    ] = await Promise.all([
      // 1. Total products
      prisma.product.count(),

      // 2. All quants in scope
      prisma.stockQuant.findMany({
        where: {
          locationId: { in: internalLocationIds },
          quantity: { gt: 0 },
        },
        include: { product: true },
      }),

      // 3. Products for low-stock check
      prisma.product.findMany({
        select: { id: true, name: true, sku: true, minReorderLevel: true, category: true },
      }),

      // 4. Pending receipts (not DONE/CANCELED)
      prisma.stockOperation.count({
        where: {
          type: 'RECEIPT',
          status: { notIn: ['DONE', 'CANCELED'] },
          ...(filterByWh ? {
            OR: [
              { destLocationId: { in: internalLocationIds } },
            ],
          } : {}),
        },
      }),

      // 5. Pending deliveries
      prisma.stockOperation.count({
        where: {
          type: 'DELIVERY',
          status: { notIn: ['DONE', 'CANCELED'] },
          ...(filterByWh ? {
            OR: [
              { sourceLocationId: { in: internalLocationIds } },
            ],
          } : {}),
        },
      }),

      // 6. Pending internal transfers
      prisma.stockOperation.count({
        where: {
          type: 'INTERNAL',
          status: { notIn: ['DONE', 'CANCELED'] },
          ...(filterByWh ? {
            OR: [
              { sourceLocationId: { in: internalLocationIds } },
              { destLocationId:   { in: internalLocationIds } },
            ],
          } : {}),
        },
      }),

      // 7. Operations summary by status
      prisma.stockOperation.groupBy({
        by: ['type', 'status'],
        _count: { id: true },
      }),

      // 8. Recent ledger entries
      prisma.stockLedger.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' },
        include: {
          product:        { select: { name: true, sku: true } },
          sourceLocation: { select: { name: true } },
          destLocation:   { select: { name: true } },
          operation:      { select: { type: true, referenceNumber: true } },
        },
      }),
    ]);

    // ── Compute KPIs ────────────────────────────────────────────────────────

    // Total stock units
    const totalStockUnits = quants.reduce((sum, q) => sum + q.quantity, 0);

    // Product totals map
    const productTotals = new Map<string, number>();
    quants.forEach((q) => {
      productTotals.set(q.productId, (productTotals.get(q.productId) ?? 0) + q.quantity);
    });

    // Low stock: qty <= minReorderLevel
    const lowStockItems = products
      .map((p) => ({ ...p, totalStock: productTotals.get(p.id) ?? 0 }))
      .filter((p) => p.totalStock <= p.minReorderLevel)
      .sort((a, b) => a.totalStock - b.totalStock)
      .slice(0, 10);

    // Top 5 products by stock
    const topProducts = products
      .map((p) => ({ ...p, totalStock: productTotals.get(p.id) ?? 0 }))
      .sort((a, b) => b.totalStock - a.totalStock)
      .slice(0, 5);

    // Operations summary matrix
    const opsSummary = operationStatusCounts.reduce(
      (acc, row) => {
        const key = `${row.type}_${row.status}`;
        acc[key] = row._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      success: true,
      data: {
        totalProductsCount,
        totalStockUnits,
        lowStockItemsCount:      lowStockItems.length,
        pendingReceiptsCount:    pendingReceipts,
        pendingDeliveriesCount:  pendingDeliveries,
        pendingTransfersCount:   pendingTransfers,
        lowStockItems,
        topProducts,
        operationsSummary:       opsSummary,
        recentLedger,
      },
    });
  } catch (error) {
    console.error('[GET /api/dashboard]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to compute dashboard KPIs' },
      { status: 500 }
    );
  }
}
