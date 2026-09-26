'use client';

import React from 'react';
import { useStock } from '@/lib/stockContext';
import {
  IconBox,
  IconTrendingUp,
  IconAlertTriangle,
  IconOperations,
  IconReceipt,
  IconDelivery,
  IconTransfer,
} from '@/components/ui/Icons';

export function KpiCards() {
  const { kpis, selectedWarehouseId, warehouses } = useStock();

  const currentWh = warehouses.find((w) => w.id === selectedWarehouseId);
  const whLabel = currentWh ? currentWh.name : 'Global Facilities';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* KPI 1: Total Stock In Hand */}
      <div className="glass-card relative overflow-hidden p-5 transition-all hover:border-blue-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Total Stock</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <IconBox size={16} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white">
            {kpis.totalStockUnits.toLocaleString()}
          </span>
          <span className="text-xs text-zinc-400">units</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-zinc-500 truncate">{whLabel}</span>
          <span className="flex items-center text-[11px] font-medium text-emerald-400">
            <IconTrendingUp size={12} className="mr-0.5" />
            +8.2% vs last wk
          </span>
        </div>
        {/* Subtle accent bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500" />
      </div>

      {/* KPI 2: Inventory Valuation */}
      <div className="glass-card relative overflow-hidden p-5 transition-all hover:border-indigo-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Active Valuation</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <IconTrendingUp size={16} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white">
            {formatCurrency(kpis.totalValuation)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-zinc-500">{kpis.totalProductsCount} Managed SKUs</span>
          <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300">
            Book Value
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-cyan-500" />
      </div>

      {/* KPI 3: Low Stock Reorder Alerts */}
      <div className="glass-card relative overflow-hidden p-5 transition-all hover:border-amber-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Safety Buffer Alerts</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <IconAlertTriangle size={16} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white">
            {kpis.lowStockItemsCount}
          </span>
          <span className="text-xs text-amber-400 font-medium">SKUs critical</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-zinc-500">Below Reorder Threshold</span>
          {kpis.lowStockItemsCount > 0 ? (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 animate-pulse">
              ACTION REQUIRED
            </span>
          ) : (
            <span className="text-emerald-400 text-[11px]">Optimal</span>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 to-orange-500" />
      </div>

      {/* KPI 4: Pending Operations Queue */}
      <div className="glass-card relative overflow-hidden p-5 transition-all hover:border-emerald-500/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Workflow Queue</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <IconOperations size={16} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-white">
            {kpis.pendingReceiptsCount + kpis.pendingDeliveriesCount + kpis.pendingTransfersCount}
          </span>
          <span className="text-xs text-zinc-400">active tasks</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <IconReceipt size={12} /> {kpis.pendingReceiptsCount} In
          </span>
          <span className="flex items-center gap-1 text-blue-400">
            <IconDelivery size={12} /> {kpis.pendingDeliveriesCount} Out
          </span>
          <span className="flex items-center gap-1 text-purple-400">
            <IconTransfer size={12} /> {kpis.pendingTransfersCount} Move
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500" />
      </div>
    </div>
  );
}
