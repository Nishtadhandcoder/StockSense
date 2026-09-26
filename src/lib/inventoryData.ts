import { Warehouse, Location, Product, StockQuant, StockOperation, StockLedger, User } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    name: 'Sarah Connor',
    email: 'admin@stocksense.com',
    role: 'ADMIN',
  },
  {
    id: 'usr-manager',
    name: 'Marcus Vance',
    email: 'manager@stocksense.com',
    role: 'INVENTORY_MANAGER',
  },
  {
    id: 'usr-staff',
    name: 'Elena Rostova',
    email: 'staff@stocksense.com',
    role: 'WAREHOUSE_STAFF',
  },
];

export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-svc',
    name: 'Silicon Valley Central',
    code: 'SVC',
  },
  {
    id: 'wh-nyh',
    name: 'New York Hub',
    code: 'NYH',
  },
];

export const INITIAL_LOCATIONS: Location[] = [
  {
    id: 'loc-vendor',
    warehouseId: null,
    name: 'Vendors (External)',
    isInternal: false,
  },
  {
    id: 'loc-customer',
    warehouseId: null,
    name: 'Customers (External)',
    isInternal: false,
  },
  {
    id: 'loc-svc-rack-a',
    warehouseId: 'wh-svc',
    name: 'Rack A - Electronics',
    isInternal: true,
  },
  {
    id: 'loc-svc-rack-b',
    warehouseId: 'wh-svc',
    name: 'Rack B - Furniture',
    isInternal: true,
  },
  {
    id: 'loc-svc-dock-1',
    warehouseId: 'wh-svc',
    name: 'Dock Bay 1 - Inbound Staging',
    isInternal: true,
  },
  {
    id: 'loc-nyh-prod-floor',
    warehouseId: 'wh-nyh',
    name: 'Production Floor',
    isInternal: true,
  },
  {
    id: 'loc-nyh-high-bay',
    warehouseId: 'wh-nyh',
    name: 'High-Bay Storage B-12',
    isInternal: true,
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Wireless Mechanical Keyboard',
    sku: 'ELEC-KEY-001',
    category: 'Electronics',
    uom: 'Units',
    minReorderLevel: 50,
    unitPrice: 129.99,
  },
  {
    id: 'prod-002',
    name: 'Ergonomic Office Chair',
    sku: 'FURN-CHR-002',
    category: 'Furniture',
    uom: 'Units',
    minReorderLevel: 20,
    unitPrice: 489.0,
  },
  {
    id: 'prod-003',
    name: '27-inch 4K IPS Monitor',
    sku: 'ELEC-MON-003',
    category: 'Electronics',
    uom: 'Units',
    minReorderLevel: 10,
    unitPrice: 399.5,
  },
  {
    id: 'prod-004',
    name: 'Standing Desk - Motorized Dual-Motor',
    sku: 'FURN-DSK-004',
    category: 'Furniture',
    uom: 'Units',
    minReorderLevel: 5,
    unitPrice: 649.0,
  },
  {
    id: 'prod-005',
    name: 'Enterprise WiFi 6 Mesh AP',
    sku: 'NET-WIFI-005',
    category: 'Networking',
    uom: 'Units',
    minReorderLevel: 25,
    unitPrice: 279.0,
  },
  {
    id: 'prod-006',
    name: 'USB-C Thunderbolt 4 Multi-Port Dock',
    sku: 'ELEC-DCK-006',
    category: 'Electronics',
    uom: 'Units',
    minReorderLevel: 30,
    unitPrice: 189.99,
  },
  {
    id: 'prod-007',
    name: 'Acoustic Sound-Dampening Partition',
    sku: 'FURN-SCR-007',
    category: 'Furniture',
    uom: 'Units',
    minReorderLevel: 12,
    unitPrice: 159.0,
  },
  {
    id: 'prod-008',
    name: 'Cat6A Shielded Patch Cable 10ft (Pack of 5)',
    sku: 'NET-CBL-008',
    category: 'Networking',
    uom: 'Packs',
    minReorderLevel: 80,
    unitPrice: 24.5,
  },
];

export const INITIAL_QUANTS: StockQuant[] = [
  // Wireless Keyboards: 110 total
  { id: 'sq-01', productId: 'prod-001', locationId: 'loc-svc-rack-a', quantity: 85 },
  { id: 'sq-02', productId: 'prod-001', locationId: 'loc-nyh-high-bay', quantity: 25 },

  // Ergonomic Chairs: 18 total (LOW STOCK! min 20)
  { id: 'sq-03', productId: 'prod-002', locationId: 'loc-svc-rack-b', quantity: 12 },
  { id: 'sq-04', productId: 'prod-002', locationId: 'loc-nyh-prod-floor', quantity: 6 },

  // 4K Monitors: 8 total (LOW STOCK! min 10)
  { id: 'sq-05', productId: 'prod-003', locationId: 'loc-svc-rack-a', quantity: 5 },
  { id: 'sq-06', productId: 'prod-003', locationId: 'loc-nyh-high-bay', quantity: 3 },

  // Standing Desk: 14 total
  { id: 'sq-07', productId: 'prod-004', locationId: 'loc-svc-rack-b', quantity: 10 },
  { id: 'sq-08', productId: 'prod-004', locationId: 'loc-nyh-prod-floor', quantity: 4 },

  // WiFi 6 Mesh AP: 42 total
  { id: 'sq-09', productId: 'prod-005', locationId: 'loc-svc-rack-a', quantity: 30 },
  { id: 'sq-10', productId: 'prod-005', locationId: 'loc-nyh-high-bay', quantity: 12 },

  // Thunderbolt Dock: 18 total (LOW STOCK! min 30)
  { id: 'sq-11', productId: 'prod-006', locationId: 'loc-svc-rack-a', quantity: 18 },

  // Acoustic Partitions: 22 total
  { id: 'sq-12', productId: 'prod-007', locationId: 'loc-svc-rack-b', quantity: 22 },

  // Cat6A Cables: 140 total
  { id: 'sq-13', productId: 'prod-008', locationId: 'loc-svc-rack-a', quantity: 95 },
  { id: 'sq-14', productId: 'prod-008', locationId: 'loc-nyh-high-bay', quantity: 45 },
];

export const INITIAL_OPERATIONS: StockOperation[] = [
  {
    id: 'op-rec-001',
    referenceNumber: 'WH/IN/2026/0001',
    type: 'RECEIPT',
    status: 'DONE',
    sourceLocationId: 'loc-vendor',
    destLocationId: 'loc-svc-rack-a',
    createdAt: '2026-09-24T09:15:00Z',
    updatedAt: '2026-09-24T11:30:00Z',
    scheduledDate: '2026-09-24',
    notes: 'Direct bulk shipment from TechSupply Global',
    moves: [
      { id: 'mv-01', operationId: 'op-rec-001', productId: 'prod-001', qty: 50 },
      { id: 'mv-02', operationId: 'op-rec-001', productId: 'prod-005', qty: 20 },
    ],
  },
  {
    id: 'op-rec-002',
    referenceNumber: 'WH/IN/2026/0002',
    type: 'RECEIPT',
    status: 'READY',
    sourceLocationId: 'loc-vendor',
    destLocationId: 'loc-svc-dock-1',
    createdAt: '2026-09-25T14:20:00Z',
    updatedAt: '2026-09-25T15:00:00Z',
    scheduledDate: '2026-09-26',
    notes: 'Awaiting barcode scanning & quality check at Dock Bay 1',
    moves: [
      { id: 'mv-03', operationId: 'op-rec-002', productId: 'prod-002', qty: 25 },
      { id: 'mv-04', operationId: 'op-rec-002', productId: 'prod-003', qty: 15 },
    ],
  },
  {
    id: 'op-rec-003',
    referenceNumber: 'WH/IN/2026/0003',
    type: 'RECEIPT',
    status: 'WAITING',
    sourceLocationId: 'loc-vendor',
    destLocationId: 'loc-nyh-high-bay',
    createdAt: '2026-09-26T08:00:00Z',
    updatedAt: '2026-09-26T08:10:00Z',
    scheduledDate: '2026-09-27',
    notes: 'Purchase Order #PO-9844 awaiting customs release',
    moves: [
      { id: 'mv-05', operationId: 'op-rec-003', productId: 'prod-006', qty: 40 },
    ],
  },
  {
    id: 'op-del-001',
    referenceNumber: 'WH/OUT/2026/0001',
    type: 'DELIVERY',
    status: 'DONE',
    sourceLocationId: 'loc-svc-rack-b',
    destLocationId: 'loc-customer',
    createdAt: '2026-09-23T10:00:00Z',
    updatedAt: '2026-09-23T16:45:00Z',
    scheduledDate: '2026-09-23',
    notes: 'Client office setup for Apex Labs',
    moves: [
      { id: 'mv-06', operationId: 'op-del-001', productId: 'prod-004', qty: 4 },
      { id: 'mv-07', operationId: 'op-del-001', productId: 'prod-002', qty: 8 },
    ],
  },
  {
    id: 'op-del-002',
    referenceNumber: 'WH/OUT/2026/0002',
    type: 'DELIVERY',
    status: 'READY',
    sourceLocationId: 'loc-svc-rack-a',
    destLocationId: 'loc-customer',
    createdAt: '2026-09-25T11:15:00Z',
    updatedAt: '2026-09-25T13:00:00Z',
    scheduledDate: '2026-09-26',
    notes: 'Pick list verified. Staged for FedEx Freight dispatch',
    moves: [
      { id: 'mv-08', operationId: 'op-del-002', productId: 'prod-001', qty: 15 },
      { id: 'mv-09', operationId: 'op-del-002', productId: 'prod-006', qty: 10 },
    ],
  },
  {
    id: 'op-del-003',
    referenceNumber: 'WH/OUT/2026/0003',
    type: 'DELIVERY',
    status: 'DRAFT',
    sourceLocationId: 'loc-nyh-high-bay',
    destLocationId: 'loc-customer',
    createdAt: '2026-09-26T09:30:00Z',
    updatedAt: '2026-09-26T09:30:00Z',
    scheduledDate: '2026-09-28',
    notes: 'Pending customer delivery address confirmation',
    moves: [
      { id: 'mv-10', operationId: 'op-del-003', productId: 'prod-008', qty: 20 },
    ],
  },
  {
    id: 'op-int-001',
    referenceNumber: 'WH/INT/2026/0001',
    type: 'INTERNAL',
    status: 'DONE',
    sourceLocationId: 'loc-svc-dock-1',
    destLocationId: 'loc-svc-rack-a',
    createdAt: '2026-09-22T08:30:00Z',
    updatedAt: '2026-09-22T10:00:00Z',
    scheduledDate: '2026-09-22',
    notes: 'Putaway from receiving dock to high-density shelf',
    moves: [
      { id: 'mv-11', operationId: 'op-int-001', productId: 'prod-001', qty: 30 },
    ],
  },
  {
    id: 'op-int-002',
    referenceNumber: 'WH/INT/2026/0002',
    type: 'INTERNAL',
    status: 'READY',
    sourceLocationId: 'loc-svc-rack-b',
    destLocationId: 'loc-nyh-prod-floor',
    createdAt: '2026-09-25T16:00:00Z',
    updatedAt: '2026-09-26T07:45:00Z',
    scheduledDate: '2026-09-26',
    notes: 'Inter-facility transfer via scheduled shuttle truck',
    moves: [
      { id: 'mv-12', operationId: 'op-int-002', productId: 'prod-007', qty: 6 },
    ],
  },
];

export const INITIAL_LEDGER: StockLedger[] = [
  {
    id: 'lg-001',
    productId: 'prod-001',
    sourceLocationId: 'loc-vendor',
    destLocationId: 'loc-svc-dock-1',
    qty: 50,
    operationId: 'op-rec-001',
    timestamp: '2026-09-24T11:30:00Z',
  },
  {
    id: 'lg-002',
    productId: 'prod-005',
    sourceLocationId: 'loc-vendor',
    destLocationId: 'loc-svc-rack-a',
    qty: 20,
    operationId: 'op-rec-001',
    timestamp: '2026-09-24T11:30:00Z',
  },
  {
    id: 'lg-003',
    productId: 'prod-004',
    sourceLocationId: 'loc-svc-rack-b',
    destLocationId: 'loc-customer',
    qty: 4,
    operationId: 'op-del-001',
    timestamp: '2026-09-23T16:45:00Z',
  },
  {
    id: 'lg-004',
    productId: 'prod-002',
    sourceLocationId: 'loc-svc-rack-b',
    destLocationId: 'loc-customer',
    qty: 8,
    operationId: 'op-del-001',
    timestamp: '2026-09-23T16:45:00Z',
  },
  {
    id: 'lg-005',
    productId: 'prod-001',
    sourceLocationId: 'loc-svc-dock-1',
    destLocationId: 'loc-svc-rack-a',
    qty: 30,
    operationId: 'op-int-001',
    timestamp: '2026-09-22T10:00:00Z',
  },
];
