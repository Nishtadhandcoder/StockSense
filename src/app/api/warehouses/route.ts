/**
 * Warehouses API — Backend Lead
 * GET  /api/warehouses         → list all warehouses with location counts
 * POST /api/warehouses         → create a new warehouse
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ── GET /api/warehouses ───────────────────────────────────────────────────────
export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        locations: {
          include: {
            quants: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const enriched = warehouses.map((wh) => ({
      id:            wh.id,
      name:          wh.name,
      code:          wh.code,
      createdAt:     wh.createdAt,
      updatedAt:     wh.updatedAt,
      locationCount: wh.locations.length,
      totalStock:    wh.locations
        .flatMap((loc) => loc.quants)
        .reduce((sum, q) => sum + q.quantity, 0),
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error('[GET /api/warehouses]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
}

// ── POST /api/warehouses ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { name, code } = await req.json();

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'name and code are required' },
        { status: 400 }
      );
    }

    const existing = await prisma.warehouse.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Warehouse code "${code}" is already in use` },
        { status: 409 }
      );
    }

    const warehouse = await prisma.warehouse.create({ data: { name, code } });

    return NextResponse.json({ success: true, data: warehouse }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/warehouses]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create warehouse' },
      { status: 500 }
    );
  }
}
