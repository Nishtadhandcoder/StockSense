'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  User,
  Warehouse,
  Location,
  Product,
  StockQuant,
  StockOperation,
  StockLedger,
  DashboardKPIs,
  OperationType,
  OperationStatus,
} from './types';
import {
  INITIAL_USERS,
  INITIAL_WAREHOUSES,
  INITIAL_LOCATIONS,
  INITIAL_PRODUCTS,
  INITIAL_QUANTS,
  INITIAL_OPERATIONS,
  INITIAL_LEDGER,
} from './inventoryData';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface StockContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  warehouses: Warehouse[];
  selectedWarehouseId: string; // 'ALL' or warehouseId
  setSelectedWarehouseId: (id: string) => void;
  locations: Location[];
  products: Product[];
  quants: StockQuant[];
  operations: StockOperation[];
  ledger: StockLedger[];
  kpis: DashboardKPIs;
  toasts: ToastNotification[];
  dismissToast: (id: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  createOperation: (data: {
    type: OperationType;
    sourceLocationId?: string | null;
    destLocationId?: string | null;
    notes?: string;
    scheduledDate?: string;
    moves: { productId: string; qty: number }[];
  }) => StockOperation;
  updateOperationStatus: (id: string, newStatus: OperationStatus) => boolean;
  getProductStock: (productId: string, warehouseId?: string) => number;
  getProductQuantsByLocation: (productId: string) => { location: Location; quantity: number }[];
}

const StockContext = createContext<StockContextType | undefined>(undefined);

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [users] = useState<User[]>(INITIAL_USERS);
  const [warehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('ALL');
  const [locations, setLocations] = useState<Location[]>(INITIAL_LOCATIONS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [quants, setQuants] = useState<StockQuant[]>(INITIAL_QUANTS);
  const [operations, setOperations] = useState<StockOperation[]>(INITIAL_OPERATIONS);
  const [ledger, setLedger] = useState<StockLedger[]>(INITIAL_LEDGER);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper: Location to Warehouse mapping
  const getLocationWarehouseId = (locId?: string | null): string | null => {
    if (!locId) return null;
    const loc = locations.find((l) => l.id === locId);
    return loc?.warehouseId || null;
  };

  // Calculate Product Stock
  const getProductStock = (productId: string, whId: string = selectedWarehouseId): number => {
    return quants
      .filter((q) => {
        if (q.productId !== productId) return false;
        if (whId === 'ALL') return true;
        const loc = locations.find((l) => l.id === q.locationId);
        return loc?.warehouseId === whId;
      })
      .reduce((sum, q) => sum + q.quantity, 0);
  };

  const getProductQuantsByLocation = (productId: string) => {
    return quants
      .filter((q) => q.productId === productId && q.quantity > 0)
      .map((q) => ({
        location: locations.find((l) => l.id === q.locationId) || {
          id: q.locationId,
          name: 'Unknown Location',
          isInternal: true,
        },
        quantity: q.quantity,
      }));
  };

  // Dynamic Dashboard KPIs calculation
  const kpis: DashboardKPIs = useMemo(() => {
    // Filter relevant locations by selected warehouse
    const relevantLocations = locations.filter((loc) => {
      if (!loc.isInternal) return false;
      if (selectedWarehouseId === 'ALL') return true;
      return loc.warehouseId === selectedWarehouseId;
    });
    const relevantLocationIds = new Set(relevantLocations.map((l) => l.id));

    // Relevant quants
    const relevantQuants = quants.filter((q) => relevantLocationIds.has(q.locationId));
    const totalStockUnits = relevantQuants.reduce((sum, q) => sum + q.quantity, 0);

    // Total valuation
    const totalValuation = relevantQuants.reduce((acc, q) => {
      const prod = products.find((p) => p.id === q.productId);
      return acc + (prod?.unitPrice || 0) * q.quantity;
    }, 0);

    // Low stock items count
    let lowStockCount = 0;
    products.forEach((prod) => {
      const stock = getProductStock(prod.id, selectedWarehouseId);
      if (stock <= prod.minReorderLevel) {
        lowStockCount++;
      }
    });

    // Relevant operations
    const relevantOps = operations.filter((op) => {
      if (selectedWarehouseId === 'ALL') return true;
      const srcWh = getLocationWarehouseId(op.sourceLocationId);
      const dstWh = getLocationWarehouseId(op.destLocationId);
      return srcWh === selectedWarehouseId || dstWh === selectedWarehouseId;
    });

    const pendingReceiptsCount = relevantOps.filter(
      (op) => op.type === 'RECEIPT' && op.status !== 'DONE' && op.status !== 'CANCELED'
    ).length;

    const pendingDeliveriesCount = relevantOps.filter(
      (op) => op.type === 'DELIVERY' && op.status !== 'DONE' && op.status !== 'CANCELED'
    ).length;

    const pendingTransfersCount = relevantOps.filter(
      (op) => op.type === 'INTERNAL' && op.status !== 'DONE' && op.status !== 'CANCELED'
    ).length;

    // Simulated capacity calculation
    const warehouseCapacityUtilization = Math.min(
      Math.round((totalStockUnits / (selectedWarehouseId === 'ALL' ? 650 : 350)) * 100),
      98
    );

    return {
      totalStockUnits,
      totalProductsCount: products.length,
      lowStockItemsCount: lowStockCount,
      pendingReceiptsCount,
      pendingDeliveriesCount,
      pendingTransfersCount,
      totalValuation,
      warehouseCapacityUtilization,
    };
  }, [quants, products, operations, selectedWarehouseId, locations]);

  // Create Stock Operation
  const createOperation = (data: {
    type: OperationType;
    sourceLocationId?: string | null;
    destLocationId?: string | null;
    notes?: string;
    scheduledDate?: string;
    moves: { productId: string; qty: number }[];
  }): StockOperation => {
    const opCount = operations.filter((o) => o.type === data.type).length + 1;
    const prefix =
      data.type === 'RECEIPT'
        ? 'WH/IN'
        : data.type === 'DELIVERY'
        ? 'WH/OUT'
        : data.type === 'INTERNAL'
        ? 'WH/INT'
        : 'WH/ADJ';
    const year = new Date().getFullYear();
    const referenceNumber = `${prefix}/${year}/${String(opCount).padStart(4, '0')}`;
    const opId = `op-${Date.now()}`;

    const newMoves = data.moves.map((m, idx) => ({
      id: `mv-${Date.now()}-${idx}`,
      operationId: opId,
      productId: m.productId,
      qty: m.qty,
      product: products.find((p) => p.id === m.productId),
    }));

    const newOp: StockOperation = {
      id: opId,
      referenceNumber,
      type: data.type,
      status: 'DRAFT',
      sourceLocationId: data.sourceLocationId || null,
      destLocationId: data.destLocationId || null,
      sourceLocation: locations.find((l) => l.id === data.sourceLocationId),
      destLocation: locations.find((l) => l.id === data.destLocationId),
      moves: newMoves,
      notes: data.notes || '',
      scheduledDate: data.scheduledDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOperations((prev) => [newOp, ...prev]);
    showToast(`Created ${data.type} ${referenceNumber} in DRAFT status`, 'info');
    return newOp;
  };

  // Update Operation Status with live Inventory Ledger & Quant updates
  const updateOperationStatus = (id: string, newStatus: OperationStatus): boolean => {
    const op = operations.find((o) => o.id === id);
    if (!op) return false;

    if (op.status === 'DONE') {
      showToast('Completed operation cannot be modified.', 'error');
      return false;
    }
    if (op.status === 'CANCELED') {
      showToast('Canceled operation cannot be transitioned.', 'error');
      return false;
    }

    // If moving to DONE, execute inventory updates
    if (newStatus === 'DONE') {
      // 1. Validation check for outgoing moves
      if (op.type === 'DELIVERY' || op.type === 'INTERNAL') {
        if (!op.sourceLocationId) {
          showToast('Source location is missing.', 'error');
          return false;
        }
        for (const move of op.moves) {
          const currentQuant = quants.find(
            (q) => q.productId === move.productId && q.locationId === op.sourceLocationId
          );
          const availableQty = currentQuant ? currentQuant.quantity : 0;
          if (availableQty < move.qty) {
            const prod = products.find((p) => p.id === move.productId);
            showToast(
              `Insufficient stock for "${prod?.name || 'Product'}". Available: ${availableQty}, Required: ${move.qty}`,
              'error'
            );
            return false;
          }
        }
      }

      // 2. Apply Stock Quant changes
      setQuants((prevQuants) => {
        let updated = [...prevQuants];

        op.moves.forEach((move) => {
          // Source decrement (if source is internal location)
          const srcLoc = locations.find((l) => l.id === op.sourceLocationId);
          if (srcLoc && srcLoc.isInternal) {
            const srcIdx = updated.findIndex(
              (q) => q.productId === move.productId && q.locationId === srcLoc.id
            );
            if (srcIdx >= 0) {
              const newQty = Math.max(0, updated[srcIdx].quantity - move.qty);
              updated[srcIdx] = { ...updated[srcIdx], quantity: newQty };
            }
          }

          // Dest increment (if dest is internal location)
          const dstLoc = locations.find((l) => l.id === op.destLocationId);
          if (dstLoc && dstLoc.isInternal) {
            const dstIdx = updated.findIndex(
              (q) => q.productId === move.productId && q.locationId === dstLoc.id
            );
            if (dstIdx >= 0) {
              updated[dstIdx] = {
                ...updated[dstIdx],
                quantity: updated[dstIdx].quantity + move.qty,
              };
            } else {
              updated.push({
                id: `sq-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                productId: move.productId,
                locationId: dstLoc.id,
                quantity: move.qty,
              });
            }
          }
        });

        return updated;
      });

      // 3. Append to StockLedger for full traceability
      const newLedgerEntries: StockLedger[] = op.moves.map((move, i) => ({
        id: `lg-${Date.now()}-${i}`,
        productId: move.productId,
        sourceLocationId: op.sourceLocationId || null,
        destLocationId: op.destLocationId || null,
        qty: move.qty,
        operationId: op.id,
        timestamp: new Date().toISOString(),
        product: products.find((p) => p.id === move.productId),
        sourceLocation: locations.find((l) => l.id === op.sourceLocationId),
        destLocation: locations.find((l) => l.id === op.destLocationId),
      }));

      setLedger((prev) => [...newLedgerEntries, ...prev]);
      showToast(`${op.referenceNumber} validated & posted to Stock Ledger!`, 'success');
    } else {
      showToast(`${op.referenceNumber} status changed to ${newStatus}`, 'info');
    }

    // Update status in operations list
    setOperations((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: newStatus,
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );

    return true;
  };

  return (
    <StockContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        warehouses,
        selectedWarehouseId,
        setSelectedWarehouseId,
        locations,
        products,
        quants,
        operations,
        ledger,
        kpis,
        toasts,
        dismissToast,
        showToast,
        createOperation,
        updateOperationStatus,
        getProductStock,
        getProductQuantsByLocation,
      }}
    >
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
}
