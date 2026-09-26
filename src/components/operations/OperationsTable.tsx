'use client';

import React, { useState, useMemo } from 'react';
import { useStock } from '@/lib/stockContext';
import { StockOperation, OperationType, OperationStatus } from '@/lib/types';
import { StatusBadge, TypeBadge } from './StatusBadge';
import {
  IconSearch,
  IconFilter,
  IconReceipt,
  IconDelivery,
  IconTransfer,
  IconCheck,
  IconChevronRight,
  IconPlus,
} from '@/components/ui/Icons';

interface OperationsTableProps {
  initialTypeFilter?: 'ALL' | OperationType;
  onSelectOperation: (op: StockOperation) => void;
  onOpenNewOperation: (type: OperationType) => void;
  title?: string;
  subtitle?: string;
}

export function OperationsTable({
  initialTypeFilter = 'ALL',
  onSelectOperation,
  onOpenNewOperation,
  title = 'Inventory Operations Log',
  subtitle = 'Manage receipts, delivery dispatches, and warehouse location transfers',
}: OperationsTableProps) {
  const { operations, updateOperationStatus, selectedWarehouseId, warehouses, locations } = useStock();

  const [typeFilter, setTypeFilter] = useState<'ALL' | OperationType>(initialTypeFilter);
  const [statusFilter, setStatusFilter] = useState<'ALL' | OperationStatus>('ALL');
  const [localSearch, setLocalSearch] = useState('');

  // Helper to resolve warehouse for a location
  const getLocationWarehouse = (locId?: string | null) => {
    if (!locId) return null;
    const loc = locations.find((l) => l.id === locId);
    return loc?.warehouseId || null;
  };

  // Filtered operations
  const filteredOperations = useMemo(() => {
    return operations.filter((op) => {
      // 1. Type filter
      if (typeFilter !== 'ALL' && op.type !== typeFilter) return false;

      // 2. Status filter
      if (statusFilter !== 'ALL' && op.status !== statusFilter) return false;

      // 3. Warehouse filter
      if (selectedWarehouseId !== 'ALL') {
        const srcWh = getLocationWarehouse(op.sourceLocationId);
        const dstWh = getLocationWarehouse(op.destLocationId);
        if (srcWh !== selectedWarehouseId && dstWh !== selectedWarehouseId) {
          return false;
        }
      }

      // 4. Search query
      if (localSearch.trim()) {
        const query = localSearch.toLowerCase();
        const matchesRef = op.referenceNumber.toLowerCase().includes(query);
        const matchesNotes = op.notes?.toLowerCase().includes(query);
        const matchesSource = op.sourceLocation?.name.toLowerCase().includes(query);
        const matchesDest = op.destLocation?.name.toLowerCase().includes(query);
        const matchesSku = op.moves.some((m) => m.product?.sku.toLowerCase().includes(query));
        if (!matchesRef && !matchesNotes && !matchesSource && !matchesDest && !matchesSku) {
          return false;
        }
      }

      return true;
    });
  }, [operations, typeFilter, statusFilter, selectedWarehouseId, localSearch, locations]);

  const getLocationName = (locId?: string | null) => {
    if (!locId) return 'N/A';
    const loc = locations.find((l) => l.id === locId);
    return loc ? loc.name : 'Unknown Location';
  };

  return (
    <div className="space-y-4">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
          <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenNewOperation('RECEIPT')}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
          >
            <IconReceipt size={14} />
            <span>+ Receipt</span>
          </button>
          <button
            onClick={() => onOpenNewOperation('DELIVERY')}
            className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/20"
          >
            <IconDelivery size={14} />
            <span>+ Delivery</span>
          </button>
          <button
            onClick={() => onOpenNewOperation('INTERNAL')}
            className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 transition-colors hover:bg-purple-500/20"
          >
            <IconTransfer size={14} />
            <span>+ Transfer</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#121212]/80 p-3 backdrop-blur-md">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <IconSearch size={15} className="absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search reference, SKU, notes..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-1.5 pl-9 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-blue-500/50 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Operation Type Tabs */}
          <div className="flex rounded-lg border border-white/[0.08] bg-white/[0.02] p-0.5 text-xs">
            {(['ALL', 'RECEIPT', 'DELIVERY', 'INTERNAL'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                  typeFilter === t
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t === 'ALL' ? 'All Types' : t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 focus:border-blue-500/50 focus:outline-none cursor-pointer"
            style={{ width: 'auto' }}
          >
            <option value="ALL" className="bg-[#121212]">
              All Statuses
            </option>
            <option value="DRAFT" className="bg-[#121212]">
              Draft
            </option>
            <option value="WAITING" className="bg-[#121212]">
              Waiting Availability
            </option>
            <option value="READY" className="bg-[#121212]">
              Ready to Process
            </option>
            <option value="DONE" className="bg-[#121212]">
              Completed
            </option>
            <option value="CANCELED" className="bg-[#121212]">
              Canceled
            </option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-card overflow-hidden p-0 border border-white/[0.08]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] uppercase tracking-wider text-zinc-400">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Source → Destination</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Schedule</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {filteredOperations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No operations found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredOperations.map((op) => {
                  const totalUnits = op.moves.reduce((sum, m) => sum + m.qty, 0);

                  return (
                    <tr
                      key={op.id}
                      onClick={() => onSelectOperation(op)}
                      className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                    >
                      {/* Reference */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-zinc-200">
                        {op.referenceNumber}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4">
                        <TypeBadge type={op.type} />
                      </td>

                      {/* Source -> Destination */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-zinc-300">
                          <span className="truncate max-w-[140px]">
                            {getLocationName(op.sourceLocationId)}
                          </span>
                          <span className="text-zinc-500">→</span>
                          <span className="truncate max-w-[140px] text-zinc-200">
                            {getLocationName(op.destLocationId)}
                          </span>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4 text-zinc-300">
                        <span className="font-semibold text-white">{totalUnits}</span> units
                        <span className="ml-1 text-[11px] text-zinc-500">
                          ({op.moves.length} {op.moves.length === 1 ? 'line' : 'lines'})
                        </span>
                      </td>

                      {/* Schedule */}
                      <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                        {op.scheduledDate || 'Today'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={op.status} />
                      </td>

                      {/* Quick Action Button */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {op.status === 'DRAFT' && (
                          <button
                            onClick={async () => { await updateOperationStatus(op.id, 'READY'); }}
                            className="rounded bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-2.5 py-1 text-[11px] font-medium transition-colors"
                          >
                            Mark Ready
                          </button>
                        )}
                        {op.status === 'READY' && (
                          <button
                            onClick={async () => { await updateOperationStatus(op.id, 'DONE'); }}
                            className="rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-medium transition-colors"
                          >
                            Validate
                          </button>
                        )}
                        {op.status === 'WAITING' && (
                          <button
                            onClick={async () => { await updateOperationStatus(op.id, 'READY'); }}
                            className="rounded bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 px-2.5 py-1 text-[11px] font-medium transition-colors"
                          >
                            Check Stock
                          </button>
                        )}
                        {op.status === 'DONE' && (
                          <span className="inline-flex items-center text-[11px] font-medium text-emerald-400/80">
                            <IconCheck size={13} className="mr-1" />
                            Audited
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
