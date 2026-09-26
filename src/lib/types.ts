export type Role = 'ADMIN' | 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF';

export type OperationType = 'RECEIPT' | 'DELIVERY' | 'INTERNAL' | 'ADJUSTMENT';

export type OperationStatus = 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
}

export interface Location {
  id: string;
  warehouseId?: string | null;
  name: string;
  isInternal: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  uom: string;
  minReorderLevel: number;
  unitPrice?: number; // Added for enterprise valuation KPIs
  imageUrl?: string;
}

export interface StockQuant {
  id: string;
  productId: string;
  locationId: string;
  quantity: number;
}

export interface StockMove {
  id: string;
  operationId: string;
  productId: string;
  qty: number;
  product?: Product;
}

export interface StockLedger {
  id: string;
  productId: string;
  sourceLocationId?: string | null;
  destLocationId?: string | null;
  qty: number;
  operationId?: string | null;
  timestamp: string;
  product?: Product;
  sourceLocation?: Location;
  destLocation?: Location;
}

export interface StockOperation {
  id: string;
  referenceNumber: string; // e.g. WH/IN/0001, WH/OUT/0002, WH/INT/0003
  type: OperationType;
  status: OperationStatus;
  sourceLocationId?: string | null;
  destLocationId?: string | null;
  sourceLocation?: Location;
  destLocation?: Location;
  moves: StockMove[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string;
}

export interface DashboardKPIs {
  totalStockUnits: number;
  totalProductsCount: number;
  lowStockItemsCount: number;
  pendingReceiptsCount: number;
  pendingDeliveriesCount: number;
  pendingTransfersCount: number;
  totalValuation: number;
  warehouseCapacityUtilization: number; // percentage
}

export interface OperationFilterState {
  type: 'ALL' | OperationType;
  status: 'ALL' | OperationStatus;
  warehouseId: 'ALL' | string;
  searchQuery: string;
}
