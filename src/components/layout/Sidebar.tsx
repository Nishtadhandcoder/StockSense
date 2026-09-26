'use client';

import React from 'react';
import Link from 'next/link';
import {
  IconDashboard,
  IconOperations,
  IconReceipt,
  IconDelivery,
  IconTransfer,
  IconInventory,
  IconWarehouse,
  IconLedger,
  IconSparkles,
} from '@/components/ui/Icons';
import { useStock } from '@/lib/stockContext';

export type NavigationTab =
  | 'dashboard'
  | 'operations'
  | 'receipts'
  | 'deliveries'
  | 'transfers'
  | 'inventory'
  | 'locations'
  | 'ledger';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  collapsed?: boolean;
}

export function Sidebar({ currentTab, onSelectTab }: SidebarProps) {
  const { kpis, selectedWarehouseId, warehouses } = useStock();

  const selectedWh = warehouses.find((w) => w.id === selectedWarehouseId);

  const mainNavItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard Overview',
      icon: IconDashboard,
      badge: null,
    },
  ];

  const operationsNavItems = [
    {
      id: 'operations' as NavigationTab,
      label: 'All Operations',
      icon: IconOperations,
      badge: null,
    },
    {
      id: 'receipts' as NavigationTab,
      label: 'Inbound Receipts',
      icon: IconReceipt,
      badge: kpis.pendingReceiptsCount > 0 ? kpis.pendingReceiptsCount : null,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    },
    {
      id: 'deliveries' as NavigationTab,
      label: 'Delivery Orders',
      icon: IconDelivery,
      badge: kpis.pendingDeliveriesCount > 0 ? kpis.pendingDeliveriesCount : null,
      badgeColor: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    },
    {
      id: 'transfers' as NavigationTab,
      label: 'Internal Transfers',
      icon: IconTransfer,
      badge: kpis.pendingTransfersCount > 0 ? kpis.pendingTransfersCount : null,
      badgeColor: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    },
  ];

  const inventoryNavItems = [
    {
      id: 'inventory' as NavigationTab,
      label: 'Products & Quants',
      icon: IconInventory,
      badge: kpis.lowStockItemsCount > 0 ? `${kpis.lowStockItemsCount} Low` : null,
      badgeColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    },
    {
      id: 'locations' as NavigationTab,
      label: 'Storage Locations',
      icon: IconWarehouse,
      badge: null,
    },
    {
      id: 'ledger' as NavigationTab,
      label: 'Stock Ledger Audit',
      icon: IconLedger,
      badge: null,
    },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col justify-between border-r border-white/[0.06] bg-[#0c0c0e] px-4 py-5 text-zinc-300 select-none">
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/90 text-white shadow-md shadow-blue-600/20">
              <IconSparkles size={16} />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                StockSense
                <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">
                  OPS
                </span>
              </span>
              <p className="text-[10px] text-zinc-500 leading-none mt-0.5">Warehouse System</p>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex flex-col gap-6 overflow-y-auto pr-1">
          {/* Section: Overview */}
          <div>
            <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Overview
            </div>
            <div className="flex flex-col gap-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/90 text-white font-semibold shadow-sm'
                        : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={isActive ? 'text-white' : 'text-zinc-400'} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Operations */}
          <div>
            <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Operations Engine
            </div>
            <div className="flex flex-col gap-1">
              {operationsNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/90 text-white font-semibold shadow-sm'
                        : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={isActive ? 'text-white' : 'text-zinc-400'} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Inventory & Traceability */}
          <div>
            <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Inventory & Audit
            </div>
            <div className="flex flex-col gap-1">
              {inventoryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/90 text-white font-semibold shadow-sm'
                        : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className={isActive ? 'text-white' : 'text-zinc-400'} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: System Routes */}
          <div>
            <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              System Views
            </div>
            <div className="flex flex-col gap-1">
              <Link
                href="/products"
                className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 transition-colors"
              >
                <span>Products Directory</span>
                <span className="text-[10px] text-zinc-500">/products</span>
              </Link>
              <Link
                href="/history"
                className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 transition-colors"
              >
                <span>Stock Move Log</span>
                <span className="text-[10px] text-zinc-500">/history</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 transition-colors"
              >
                <span>Warehouse Hubs</span>
                <span className="text-[10px] text-zinc-500">/settings</span>
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 transition-colors"
              >
                <span>Auth Portal</span>
                <span className="text-[10px] text-zinc-500">/login</span>
              </Link>
            </div>
          </div>
        </nav>
      </div>

      {/* Facility Status Card */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-zinc-400">Scope</span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-medium text-emerald-400">Active</span>
          </div>
        </div>
        <div className="mt-1 text-xs font-semibold text-zinc-200 truncate">
          {selectedWh ? `${selectedWh.name}` : 'All Warehouse Hubs'}
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
          <span>Capacity: {kpis.warehouseCapacityUtilization}%</span>
          <span>{kpis.totalStockUnits} Units</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${kpis.warehouseCapacityUtilization}%` }}
          />
        </div>
      </div>
    </aside>
  );
}
