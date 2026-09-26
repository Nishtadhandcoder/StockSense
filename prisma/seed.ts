/**
 * Prisma Seed — StockSense (Backend Lead)
 *
 * Creates a rich, realistic tech-warehouse dataset:
 *  - 3 user roles (Admin, Manager, Staff)
 *  - 2 warehouses (HQ + Branch) with 7 internal locations + 2 external
 *  - 12 realistic electronics/tech products with real SKUs
 *  - Pre-seeded StockQuant (opening balances per location)
 *  - 8 completed StockOperations covering all 4 types (RECEIPT/DELIVERY/INTERNAL/ADJUSTMENT)
 *  - Matching StockLedger entries for full audit trail
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting StockSense seed...\n');

  // ── 1. Clean slate ──────────────────────────────────────────────────────────
  await prisma.stockLedger.deleteMany();
  await prisma.stockMove.deleteMany();
  await prisma.stockOperation.deleteMany();
  await prisma.stockQuant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.location.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.user.deleteMany();
  console.log('✓ Cleaned existing data');

  // ── 2. Users ────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);

  const [admin, manager, staff] = await Promise.all([
    prisma.user.create({
      data: { name: 'Alex Chen',       email: 'admin@stocksense.com',   passwordHash, role: 'ADMIN' },
    }),
    prisma.user.create({
      data: { name: 'Priya Sharma',    email: 'manager@stocksense.com', passwordHash, role: 'INVENTORY_MANAGER' },
    }),
    prisma.user.create({
      data: { name: 'Jordan Williams', email: 'staff@stocksense.com',   passwordHash, role: 'WAREHOUSE_STAFF' },
    }),
  ]);
  console.log(`✓ Created 3 users (admin: ${admin.email}, manager: ${manager.email}, staff: ${staff.email})`);

  // ── 3. Warehouses ───────────────────────────────────────────────────────────
  const [hqWarehouse, branchWarehouse] = await Promise.all([
    prisma.warehouse.create({ data: { name: 'HQ — Silicon Valley Central', code: 'SVC' } }),
    prisma.warehouse.create({ data: { name: 'Branch — New York Hub',       code: 'NYH' } }),
  ]);
  console.log('✓ Created 2 warehouses');

  // ── 4. Locations ────────────────────────────────────────────────────────────
  // External virtual locations (no warehouseId)
  const [vendorLocation, customerLocation] = await Promise.all([
    prisma.location.create({ data: { name: 'Vendors (External)',   isInternal: false } }),
    prisma.location.create({ data: { name: 'Customers (External)', isInternal: false } }),
  ]);

  // HQ internal locations
  const [hqMainStore, hqRackA, hqRackB] = await Promise.all([
    prisma.location.create({ data: { name: 'HQ / Main Store',      warehouseId: hqWarehouse.id, isInternal: true } }),
    prisma.location.create({ data: { name: 'HQ / Rack A — Electronics', warehouseId: hqWarehouse.id, isInternal: true } }),
    prisma.location.create({ data: { name: 'HQ / Rack B — Accessories', warehouseId: hqWarehouse.id, isInternal: true } }),
    prisma.location.create({ data: { name: 'HQ / Staging Area',    warehouseId: hqWarehouse.id, isInternal: true } }),
    prisma.location.create({ data: { name: 'HQ / Production Floor',warehouseId: hqWarehouse.id, isInternal: true } }),
  ]);

  // Branch internal locations
  const [branchStore] = await Promise.all([
    prisma.location.create({ data: { name: 'NYH / Main Store',     warehouseId: branchWarehouse.id, isInternal: true } }),
    prisma.location.create({ data: { name: 'NYH / Receiving Dock', warehouseId: branchWarehouse.id, isInternal: true } }),
  ]);
  console.log('✓ Created 9 locations (7 internal, 2 external)');

  // ── 5. Products ─────────────────────────────────────────────────────────────
  // Real-world tech/electronics products with genuine SKU patterns
  const productData = [
    { name: 'USB-C Hub 7-Port 100W PD',        sku: 'EL-UCH-7P-001', category: 'Electronics',  uom: 'pcs', minReorderLevel: 20 },
    { name: 'Mechanical Keyboard TKL Brown',    sku: 'EL-MK-TKL-002', category: 'Electronics',  uom: 'pcs', minReorderLevel: 15 },
    { name: '27" 4K IPS Monitor 144Hz',         sku: 'EL-MN-27K-003', category: 'Electronics',  uom: 'pcs', minReorderLevel: 8  },
    { name: 'Wireless Ergonomic Mouse',         sku: 'EL-WM-ERG-004', category: 'Electronics',  uom: 'pcs', minReorderLevel: 25 },
    { name: 'HDMI 2.1 Cable 2m 8K',            sku: 'CA-HD-21-005',   category: 'Cables',       uom: 'pcs', minReorderLevel: 60 },
    { name: 'NVMe SSD M.2 1TB PCIe 4.0',       sku: 'ST-SS-1T-006',   category: 'Storage',      uom: 'pcs', minReorderLevel: 30 },
    { name: 'DDR5 RAM 16GB 5600MHz',            sku: 'ST-RM-16-007',   category: 'Storage',      uom: 'pcs', minReorderLevel: 40 },
    { name: 'Laptop Stand Aluminum Adjustable', sku: 'AC-LS-AL-008',   category: 'Accessories',  uom: 'pcs', minReorderLevel: 20 },
    { name: 'Cable Management Tray Under-Desk', sku: 'AC-CM-UD-009',   category: 'Accessories',  uom: 'set', minReorderLevel: 30 },
    { name: 'UPS 650VA 400W AVR',              sku: 'PW-UP-65-010',   category: 'Power',         uom: 'pcs', minReorderLevel: 10 },
    { name: 'USB-C to 3.5mm Audio Adapter',    sku: 'CA-UA-35-011',   category: 'Cables',        uom: 'pcs', minReorderLevel: 50 },
    { name: 'Webcam 4K 30fps Autofocus',       sku: 'EL-WC-4K-012',   category: 'Electronics',  uom: 'pcs', minReorderLevel: 12 },
  ];

  const products = await Promise.all(productData.map((p) => prisma.product.create({ data: p })));
  const [usbHub, keyboard, monitor, mouse, hdmiCable, nvmeSsd, ddr5Ram,
    laptopStand, cableTray, ups, usbAdapter, webcam] = products;
  console.log(`✓ Created ${products.length} products`);

  // ── 6. Opening Stock Balances (StockQuant) ──────────────────────────────────
  // These represent the warehouse's existing stock before the tracked operations below
  const openingBalances = [
    // HQ Rack A — Electronics
    { productId: usbHub.id,     locationId: hqRackA.id, quantity: 85  },
    { productId: keyboard.id,   locationId: hqRackA.id, quantity: 42  },
    { productId: monitor.id,    locationId: hqRackA.id, quantity: 22  },
    { productId: mouse.id,      locationId: hqRackA.id, quantity: 63  },
    { productId: nvmeSsd.id,    locationId: hqRackA.id, quantity: 58  },
    { productId: ddr5Ram.id,    locationId: hqRackA.id, quantity: 95  },
    { productId: webcam.id,     locationId: hqRackA.id, quantity: 17  },

    // HQ Rack B — Accessories
    { productId: laptopStand.id, locationId: hqRackB.id, quantity: 44 },
    { productId: cableTray.id,   locationId: hqRackB.id, quantity: 67 },
    { productId: ups.id,         locationId: hqRackB.id, quantity: 18 },

    // HQ Main Store — cables
    { productId: hdmiCable.id,   locationId: hqMainStore.id, quantity: 120 },
    { productId: usbAdapter.id,  locationId: hqMainStore.id, quantity: 88  },

    // Branch Store
    { productId: keyboard.id,    locationId: branchStore.id, quantity: 20  },
    { productId: mouse.id,       locationId: branchStore.id, quantity: 30  },
    { productId: monitor.id,     locationId: branchStore.id, quantity: 6   },
    { productId: usbHub.id,      locationId: branchStore.id, quantity: 15  },
    { productId: webcam.id,      locationId: branchStore.id, quantity: 4   },  // Low stock!
  ];

  await Promise.all(openingBalances.map((b) => prisma.stockQuant.create({ data: b })));
  console.log(`✓ Created ${openingBalances.length} opening stock balance records`);

  // ── 7. Historical Operations + Ledger Entries ───────────────────────────────
  // We seed realistic completed operations for a convincing audit trail

  interface MoveInput { productId: string; qty: number }

  async function createCompletedOperation(data: {
    referenceNumber: string;
    type: string;
    sourceLocationId?: string | null;
    destLocationId?:   string | null;
    notes: string;
    daysAgo: number;
    moves: MoveInput[];
  }) {
    const createdAt = new Date(Date.now() - data.daysAgo * 24 * 60 * 60 * 1000);

    const op = await prisma.stockOperation.create({
      data: {
        referenceNumber: data.referenceNumber,
        type:            data.type,
        status:          'DONE',
        sourceLocationId: data.sourceLocationId ?? null,
        destLocationId:   data.destLocationId   ?? null,
        notes:            data.notes,
        scheduledDate:    createdAt,
        createdAt,
        updatedAt:        createdAt,
        moves: {
          create: data.moves.map((m) => ({
            productId: m.productId,
            qty:       m.qty,
            createdAt,
            updatedAt: createdAt,
          })),
        },
      } as any,
      include: { moves: true },
    }) as any;

    // Write ledger entries for each move
    await Promise.all(
      ((op.moves || []) as Array<{ productId: string; qty: number }>).map((move) =>
        prisma.stockLedger.create({
          data: {
            productId:        move.productId,
            sourceLocationId: data.sourceLocationId ?? null,
            destLocationId:   data.destLocationId   ?? null,
            qty:              move.qty,
            operationId:      op.id,
            timestamp:        createdAt,
          },
        })
      )
    );

    return op;
  }

  // RECEIPT 1 — Initial bulk intake from vendor → HQ Rack A (14 days ago)
  await createCompletedOperation({
    referenceNumber: 'WH/IN/2026/0001',
    type: 'RECEIPT',
    sourceLocationId: vendorLocation.id,
    destLocationId:   hqRackA.id,
    notes: 'PO-2026-001 | TechSupply Logistics — Q3 electronics restock',
    daysAgo: 14,
    moves: [
      { productId: usbHub.id,   qty: 100 },
      { productId: keyboard.id, qty: 60  },
      { productId: monitor.id,  qty: 30  },
      { productId: mouse.id,    qty: 80  },
    ],
  });

  // RECEIPT 2 — Storage components from vendor → HQ Rack A (10 days ago)
  await createCompletedOperation({
    referenceNumber: 'WH/IN/2026/0002',
    type: 'RECEIPT',
    sourceLocationId: vendorLocation.id,
    destLocationId:   hqRackA.id,
    notes: 'PO-2026-002 | StoreMaster Inc — NVMe SSD & RAM modules',
    daysAgo: 10,
    moves: [
      { productId: nvmeSsd.id, qty: 75 },
      { productId: ddr5Ram.id, qty: 120 },
    ],
  });

  // RECEIPT 3 — Cables from vendor → HQ Main Store (8 days ago)
  await createCompletedOperation({
    referenceNumber: 'WH/IN/2026/0003',
    type: 'RECEIPT',
    sourceLocationId: vendorLocation.id,
    destLocationId:   hqMainStore.id,
    notes: 'PO-2026-003 | CableCo Distributors — HDMI and USB-C adapters',
    daysAgo: 8,
    moves: [
      { productId: hdmiCable.id,  qty: 150 },
      { productId: usbAdapter.id, qty: 100 },
    ],
  });

  // DELIVERY 1 — Customer order from HQ Rack A (6 days ago)
  await createCompletedOperation({
    referenceNumber: 'WH/OUT/2026/0001',
    type: 'DELIVERY',
    sourceLocationId: hqRackA.id,
    destLocationId:   customerLocation.id,
    notes: 'SO-2026-0041 | Enterprise Outbound — Acme Corp order',
    daysAgo: 6,
    moves: [
      { productId: usbHub.id,   qty: 15 },
      { productId: keyboard.id, qty: 18 },
      { productId: mouse.id,    qty: 17 },
    ],
  });

  // DELIVERY 2 — Customer order from Branch Store (4 days ago)
  await createCompletedOperation({
    referenceNumber: 'WH/OUT/2026/0002',
    type: 'DELIVERY',
    sourceLocationId: branchStore.id,
    destLocationId:   customerLocation.id,
    notes: 'SO-2026-0055 | Branch outbound — NovaTech startup order',
    daysAgo: 4,
    moves: [
      { productId: keyboard.id, qty: 5 },
      { productId: mouse.id,    qty: 8 },
    ],
  });

  // INTERNAL Transfer — HQ Rack A → Branch Store (3 days ago)
  await createCompletedOperation({
    referenceNumber: 'WH/INT/2026/0001',
    type: 'INTERNAL',
    sourceLocationId: hqRackA.id,
    destLocationId:   branchStore.id,
    notes: 'Branch replenishment — Q3 rebalancing transfer',
    daysAgo: 3,
    moves: [
      { productId: usbHub.id,  qty: 20 },
      { productId: webcam.id,  qty: 8  },
    ],
  });

  // ADJUSTMENT — Rack A inventory correction (2 days ago)
  await createCompletedOperation({
    referenceNumber: 'WH/ADJ/2026/0001',
    type: 'ADJUSTMENT',
    sourceLocationId: null,
    destLocationId:   hqRackA.id,
    notes: 'Physical count variance correction — cycle count Q3/2026',
    daysAgo: 2,
    moves: [
      { productId: keyboard.id, qty: 5 },  // +5 found during count
      { productId: webcam.id,   qty: 3 },  // +3 found during count
    ],
  });

  // RECEIPT 4 — Accessories from vendor → HQ Rack B (1 day ago)
  await createCompletedOperation({
    referenceNumber: 'WH/IN/2026/0004',
    type: 'RECEIPT',
    sourceLocationId: vendorLocation.id,
    destLocationId:   hqRackB.id,
    notes: 'PO-2026-007 | OfficePro Supplies — accessories restocking',
    daysAgo: 1,
    moves: [
      { productId: laptopStand.id, qty: 30 },
      { productId: cableTray.id,   qty: 40 },
      { productId: ups.id,         qty: 15 },
    ],
  });

  const [ledgerCount, opCount] = await Promise.all([
    prisma.stockLedger.count(),
    prisma.stockOperation.count(),
  ]);

  console.log(`✓ Created ${opCount} historical operations with ${ledgerCount} ledger entries`);
  console.log('\n✅ Seed completed successfully!\n');
  console.log('  Login credentials (password: password123):');
  console.log(`    Admin:   admin@stocksense.com`);
  console.log(`    Manager: manager@stocksense.com`);
  console.log(`    Staff:   staff@stocksense.com`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
