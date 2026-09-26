'use client';

import React from 'react';
import { useStock } from '@/lib/stockContext';
import { IconWarehouse, IconOperations } from '@/components/ui/Icons';
import { OperationStatus } from '@/lib/types';

interface OperationsSummaryProps {
  onFilterStatus?: (status: OperationStatus) => void;
}

export function OperationsSummary({ onFilterStatus }: OperationsSummaryProps) {
  const { locations, quants, operations, selectedWarehouseId, warehouses } = useStock();

  // Internal locations filtered by warehouse
  const internalLocations = locations.filter((loc) => {
    if (!loc.isInternal) return false;
    if (selectedWarehouseId === 'ALL') return true;
    return loc.warehouseId === selectedWarehouseId;
  });

  const getLocationStock = (locId: string) => {
    return quants
      .filter((q) => q.locationId === locId)
      .reduce((sum, q) => sum + q.quantity, 0);
  };

  const statusCounts: Record<OperationStatus, number> = {
    DRAFT: operations.filter((o) => o.status === 'DRAFT').length,
    WAITING: operations.filter((o) => o.status === 'WAITING').length,
    READY: operations.filter((o) => o.status === 'READY').length,
    DONE: operations.filter((o) => o.status === 'DONE').length,
    CANCELED: operations.filter((o) => o.status === 'CANCELED').length,
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Card 1: Facility Storage Allocation */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <IconWarehouse size={16} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-zinc-100">Facility Location Allocation</h3>
          </div>
          <span className="text-[11px] text-zinc-400">{internalLocations.length} Active Zones</span>
        </div>

        <div className="mt-4 space-y-3.5">
          {internalLocations.map((loc) => {
            const stock = getLocationStock(loc.id);
            const parentWh = warehouses.find((w) => w.id === loc.warehouseId);
            const percentage = Math.min(Math.round((stock / 150) * 100), 100);

            return (
              <div key={loc.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-200">
                    {loc.name}
                    {parentWh && (
                      <span className="ml-1.5 text-[10px] text-zinc-500">[{parentWh.code}]</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-[11px]">{stock} units</span>
                    <span className="font-mono text-[10px] text-zinc-500">{percentage}%</span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      percentage > 80
                        ? 'bg-rose-500'
                        : percentage > 50
                        ? 'bg-blue-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(percentage, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card 2: Operations Pipeline Health */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <IconOperations size={16} className="text-purple-400" />
            <h3 className="text-sm font-semibold text-zinc-100">Operations Pipeline Stages</h3>
          </div>
          <span className="text-[11px] text-zinc-400">{operations.length} Total Records</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => onFilterStatus?.('READY')}
            className="flex flex-col justify-between rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-left transition-all hover:bg-blue-500/10 hover:border-blue-500/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-300">Ready to Process</span>
              <span className="h-2 w-2 rounded-full bg-blue-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{statusCounts.READY}</div>
            <div className="text-[10px] text-zinc-400">Available for pick & pack</div>
          </button>

          <button
            onClick={() => onFilterStatus?.('WAITING')}
            className="flex flex-col justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-left transition-all hover:bg-amber-500/10 hover:border-amber-500/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-300">Waiting Stock</span>
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{statusCounts.WAITING}</div>
            <div className="text-[10px] text-zinc-400">Pending inbound receipts</div>
          </button>

          <button
            onClick={() => onFilterStatus?.('DRAFT')}
            className="flex flex-col justify-between rounded-xl border border-zinc-700/60 bg-white/[0.02] p-3.5 text-left transition-all hover:bg-white/[0.05]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">Draft Orders</span>
              <span className="h-2 w-2 rounded-full bg-zinc-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{statusCounts.DRAFT}</div>
            <div className="text-[10px] text-zinc-400">Unconfirmed work orders</div>
          </button>

          <button
            onClick={() => onFilterStatus?.('DONE')}
            className="flex flex-col justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-left transition-all hover:bg-emerald-500/10 hover:border-emerald-500/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-300">Completed & Audited</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{statusCounts.DONE}</div>
            <div className="text-[10px] text-zinc-400">Ledger confirmed</div>
          </button>
        </div>
      </div>
    </div>
  );
}
