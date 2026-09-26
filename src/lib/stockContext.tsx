'use client';

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
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

// ─── Toast ────────────────────────────────────────────────────────────────────
interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

// ─── Context shape (unchanged public API) ─────────────────────────────────────
interface StockContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  warehouses: Warehouse[];
  selectedWarehouseId: string;
  setSelectedWarehouseId: (id: string) => void;
  locations: Location[];
  products: Product[];
  quants: StockQuant[];
  operations: StockOperation[];
  ledger: StockLedger[];
  kpis: DashboardKPIs;
  isLoading: boolean;
  toasts: ToastNotification[];
  dismissToast: (id: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  /** Create a new DRAFT operation via POST /api/operations */
  createOperation: (data: {
    type: OperationType;
    sourceLocationId?: string | null;
    destLocationId?: string | null;
    notes?: string;
    scheduledDate?: string;
    moves: { productId: string; qty: number }[];
  }) => Promise<StockOperation>;
  /** Transition an operation status via the matching API action */
  updateOperationStatus: (id: string, newStatus: OperationStatus) => Promise<boolean>;
  getProductStock: (productId: string, warehouseId?: string) => number;
  getProductQuantsByLocation: (productId: string) => { location: Location; quantity: number }[];
  /** Force-refresh all data from the server */
  refresh: () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DEFAULT_KPIs: DashboardKPIs = {
  totalStockUnits: 0,
  totalProductsCount: 0,
  lowStockItemsCount: 0,
  pendingReceiptsCount: 0,
  pendingDeliveriesCount: 0,
  pendingTransfersCount: 0,
  totalValuation: 0,
  warehouseCapacityUtilization: 0,
};

const ADMIN_USER: User = {
  id: 'local-admin',
  name: 'Admin',
  email: 'admin@stocksense.com',
  role: 'ADMIN',
};

// ─── Context ──────────────────────────────────────────────────────────────────
const StockContext = createContext<StockContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function StockProvider({ children }: { children: React.ReactNode }) {
  // ── Auth (unchanged) ──────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<User>(ADMIN_USER);
  const [users] = useState<User[]>([ADMIN_USER]);

  // ── Warehouse filter ──────────────────────────────────────────────────────
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('ALL');

  // ── Remote data ───────────────────────────────────────────────────────────
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [quants, setQuants] = useState<StockQuant[]>([]);
  const [operations, setOperations] = useState<StockOperation[]>([]);
  const [ledger, setLedger] = useState<StockLedger[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs>(DEFAULT_KPIs);
  const [isLoading, setIsLoading] = useState(true);

  // ── Toasts ────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Data fetching
  // ─────────────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const whParam =
        selectedWarehouseId !== 'ALL' ? `?warehouseId=${selectedWarehouseId}` : '';

      const [whRes, locRes, prodRes, quantRes, opsRes, ledgerRes, dashRes] =
        await Promise.allSettled([
          fetch('/api/warehouses'),
          fetch('/api/locations'),
          fetch('/api/products'),
          fetch('/api/stock-quant'),
          fetch(`/api/operations?limit=100${whParam ? '&' + whParam.slice(1) : ''}`),
          fetch('/api/ledger?limit=50'),
          fetch(`/api/dashboard${whParam}`),
        ]);

      // Warehouses
      if (whRes.status === 'fulfilled' && whRes.value.ok) {
        const data = await whRes.value.json();
        setWarehouses(data.data ?? []);
      }

      // Locations
      if (locRes.status === 'fulfilled' && locRes.value.ok) {
        const data = await locRes.value.json();
        setLocations(data.data ?? []);
      }

      // Products
      if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
        const data = await prodRes.value.json();
        setProducts(data.data ?? []);
      }

      // Stock Quants
      if (quantRes.status === 'fulfilled' && quantRes.value.ok) {
        const data = await quantRes.value.json();
        // API returns { data: [ { id, productId, locationId, quantity } ] }
        setQuants(data.data ?? []);
      }

      // Operations
      if (opsRes.status === 'fulfilled' && opsRes.value.ok) {
        const data = await opsRes.value.json();
        setOperations(data.data ?? []);
      }

      // Ledger
      if (ledgerRes.status === 'fulfilled' && ledgerRes.value.ok) {
        const data = await ledgerRes.value.json();
        setLedger(data.data ?? []);
      }

      // Dashboard KPIs
      if (dashRes.status === 'fulfilled' && dashRes.value.ok) {
        const data = await dashRes.value.json();
        if (data.success && data.data) {
          const d = data.data;
          setKpis({
            totalStockUnits: d.totalStockUnits ?? 0,
            totalProductsCount: d.totalProductsCount ?? 0,
            lowStockItemsCount: d.lowStockItemsCount ?? 0,
            pendingReceiptsCount: d.pendingReceiptsCount ?? 0,
            pendingDeliveriesCount: d.pendingDeliveriesCount ?? 0,
            pendingTransfersCount: d.pendingTransfersCount ?? 0,
            totalValuation: d.totalValuation ?? 0,
            warehouseCapacityUtilization: d.warehouseCapacityUtilization ?? 0,
          });
        }
      }
    } catch (err) {
      console.error('[StockContext] fetchAll failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWarehouseId]);

  // Initial load + re-fetch when warehouse filter changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, [fetchAll]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived helpers (client-side, use cached quants/locations)
  // ─────────────────────────────────────────────────────────────────────────
  const getProductStock = useCallback(
    (productId: string, whId: string = selectedWarehouseId): number => {
      return quants
        .filter((q) => {
          if (q.productId !== productId) return false;
          if (whId === 'ALL') return true;
          const loc = locations.find((l) => l.id === q.locationId);
          return loc?.warehouseId === whId;
        })
        .reduce((sum, q) => sum + q.quantity, 0);
    },
    [quants, locations, selectedWarehouseId]
  );

  const getProductQuantsByLocation = useCallback(
    (productId: string) => {
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
    },
    [quants, locations]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * POST /api/operations — creates a DRAFT operation with moves
   */
  const createOperation = useCallback(
    async (data: {
      type: OperationType;
      sourceLocationId?: string | null;
      destLocationId?: string | null;
      notes?: string;
      scheduledDate?: string;
      moves: { productId: string; qty: number }[];
    }): Promise<StockOperation> => {
      const res = await fetch('/api/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const msg = json.error || 'Failed to create operation';
        showToast(msg, 'error');
        throw new Error(msg);
      }

      const newOp: StockOperation = json.data;

      // Optimistically prepend to local state
      setOperations((prev) => [newOp, ...prev]);
      showToast(`Created ${data.type} ${newOp.referenceNumber} in DRAFT`, 'info');

      return newOp;
    },
    [showToast]
  );

  /**
   * Transition an operation to the next status:
   *  DRAFT     → confirm  → READY
   *  READY     → validate → DONE  (triggers stock engine)
   *  any       → cancel   → CANCELED
   */
  const updateOperationStatus = useCallback(
    async (id: string, newStatus: OperationStatus): Promise<boolean> => {
      let endpoint = '';
      const method = 'POST';

      if (newStatus === 'READY' || newStatus === 'WAITING') {
        endpoint = `/api/operations/${id}/confirm`;
      } else if (newStatus === 'DONE') {
        endpoint = `/api/operations/${id}/validate`;
      } else if (newStatus === 'CANCELED') {
        endpoint = `/api/operations/${id}/cancel`;
      } else {
        showToast(`Unknown target status: ${newStatus}`, 'error');
        return false;
      }

      try {
        const res = await fetch(endpoint, { method });
        const json = await res.json();

        if (!res.ok || !json.success) {
          const msg = json.error || 'Operation status update failed';
          showToast(msg, 'error');
          return false;
        }

        const updatedOp: StockOperation = json.data;

        // Update local state
        setOperations((prev) =>
          prev.map((o) => (o.id === id ? updatedOp : o))
        );

        if (newStatus === 'DONE') {
          showToast(`${updatedOp.referenceNumber} validated & posted to Ledger!`, 'success');
          // Refresh quants + ledger + KPIs after validation
          await fetchAll();
        } else if (newStatus === 'CANCELED') {
          showToast(`${updatedOp.referenceNumber} cancelled`, 'info');
          await fetchAll();
        } else {
          showToast(
            `${updatedOp.referenceNumber} status → ${updatedOp.status}`,
            'info'
          );
        }

        return true;
      } catch (err) {
        console.error('[updateOperationStatus]', err);
        showToast('Network error — could not update operation', 'error');
        return false;
      }
    },
    [showToast, fetchAll]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Context value
  // ─────────────────────────────────────────────────────────────────────────
  const value = useMemo<StockContextType>(
    () => ({
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
      isLoading,
      toasts,
      dismissToast,
      showToast,
      createOperation,
      updateOperationStatus,
      getProductStock,
      getProductQuantsByLocation,
      refresh: fetchAll,
    }),
    [
      currentUser,
      users,
      warehouses,
      selectedWarehouseId,
      locations,
      products,
      quants,
      operations,
      ledger,
      kpis,
      isLoading,
      toasts,
      dismissToast,
      showToast,
      createOperation,
      updateOperationStatus,
      getProductStock,
      getProductQuantsByLocation,
      fetchAll,
    ]
  );

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useStock() {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
}
