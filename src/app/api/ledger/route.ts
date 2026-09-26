/**
 * Ledger API — Backend Lead  (Immutable Audit Trail)
 * GET /api/ledger → paginated, filterable stock ledger
 *
 * Query params:
 *   ?productId=    → filter by product
 *   ?locationId=   → entries touching this location (source OR dest)
 *   ?operationId=  → entries for a specific operation
 *   ?from=         → ISO date — entries at or after this timestamp
 *   ?to=           → ISO date — entries at or before this timestamp
 *   ?page=1        → page number (default 1)
 *   ?limit=20      → page size (default 20, max 100)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId   = searchParams.get('productId');
    const locationId  = searchParams.get('locationId');
    const operationId = searchParams.get('operationId');
    const from        = searchParams.get('from');
    const to          = searchParams.get('to');
    const page        = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit       = Math.min(100, parseInt(searchParams.get('limit') ?? '20'));

    const where: Record<string, unknown> = {};

    if (productId)  where.productId  = productId;
    if (operationId) where.operationId = operationId;

    // Filter by location: either as source or destination
    if (locationId) {
      where.OR = [
        { sourceLocationId: locationId },
        { destLocationId:   locationId },
      ];
    }

    // Date range filter
    if (from || to) {
      where.timestamp = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to   ? { lte: new Date(to)   } : {}),
      };
    }

    const [total, entries] = await Promise.all([
      prisma.stockLedger.count({ where }),
      prisma.stockLedger.findMany({
        where,
        include: {
          product: {
            select: { id: true, name: true, sku: true, uom: true, category: true },
          },
          sourceLocation: {
            select: { id: true, name: true, isInternal: true,
              warehouse: { select: { id: true, name: true, code: true } } },
          },
          destLocation: {
            select: { id: true, name: true, isInternal: true,
              warehouse: { select: { id: true, name: true, code: true } } },
          },
          operation: {
            select: { id: true, type: true, status: true, referenceNumber: true },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip:  (page - 1) * limit,
        take:  limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: entries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[GET /api/ledger]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ledger' },
      { status: 500 }
    );
  }
}
