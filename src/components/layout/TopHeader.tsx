'use client';

import React, { useState } from 'react';
import { useStock } from '@/lib/stockContext';
import {
  IconSearch,
  IconWarehouse,
  IconChevronDown,
  IconPlus,
  IconBell,
  IconUser,
  IconReceipt,
  IconDelivery,
  IconTransfer,
  IconAlertTriangle,
} from '@/components/ui/Icons';
import { Role } from '@/lib/types';

interface TopHeaderProps {
  onOpenNewOperation?: (type: 'RECEIPT' | 'DELIVERY' | 'INTERNAL') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function TopHeader({ onOpenNewOperation, searchQuery, setSearchQuery }: TopHeaderProps) {
  const {
    currentUser,
    setCurrentUser,
    users,
    warehouses,
    selectedWarehouseId,
    setSelectedWarehouseId,
    kpis,
  } = useStock();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const selectedWarehouse = warehouses.find((w) => w.id === selectedWarehouseId);

  const getRoleBadgeStyle = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'INVENTORY_MANAGER':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'WAREHOUSE_STAFF':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      default:
        return 'bg-zinc-800 text-zinc-300';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/[0.08] bg-[#0a0a0a]/80 px-6 backdrop-blur-xl">
      {/* Global Search Bar */}
      <div className="flex items-center gap-3 w-72 md:w-96">
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
            <IconSearch size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search operations, SKUs, locations..."
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 pl-9 pr-12 text-sm text-zinc-200 placeholder-zinc-500 transition-all focus:border-blue-500/50 focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-2.5 hidden rounded border border-white/[0.1] bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 sm:inline-block">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Controls: Warehouse Filter, Quick Action, Alerts, User Profile */}
      <div className="flex items-center gap-3">
        {/* Warehouse Selector Filter */}
        <div className="relative">
          <div className="flex items-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/[0.15]">
            <IconWarehouse size={14} className="mr-2 text-blue-400" />
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="cursor-pointer bg-transparent text-xs font-medium text-zinc-200 focus:outline-none"
              style={{ border: 'none', padding: 0, width: 'auto' }}
            >
              <option value="ALL" className="bg-[#121212] text-zinc-200">
                All Hubs ({warehouses.length})
              </option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id} className="bg-[#121212] text-zinc-200">
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Create Action Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowQuickMenu(!showQuickMenu);
              setShowRoleMenu(false);
              setShowNotifications(false);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 active:scale-95"
          >
            <IconPlus size={15} />
            <span className="hidden sm:inline">New Operation</span>
            <IconChevronDown size={13} className="opacity-80" />
          </button>

          {showQuickMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/[0.1] bg-[#121212] p-1.5 shadow-2xl backdrop-blur-xl animate-fade-in z-50">
              <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Workflow Operations
              </div>
              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenNewOperation?.('RECEIPT');
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-zinc-200 hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
                  <IconReceipt size={14} />
                </div>
                <div>
                  <div className="font-medium">Inbound Receipt</div>
                  <div className="text-[10px] text-zinc-500">Receive goods from vendor</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenNewOperation?.('DELIVERY');
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-zinc-200 hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10 text-blue-400">
                  <IconDelivery size={14} />
                </div>
                <div>
                  <div className="font-medium">Delivery Order</div>
                  <div className="text-[10px] text-zinc-500">Dispatch stock to customer</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onOpenNewOperation?.('INTERNAL');
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-zinc-200 hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/10 text-purple-400">
                  <IconTransfer size={14} />
                </div>
                <div>
                  <div className="font-medium">Internal Transfer</div>
                  <div className="text-[10px] text-zinc-500">Move between racks / hubs</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowQuickMenu(false);
              setShowRoleMenu(false);
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <IconBell size={16} />
            {kpis.lowStockItemsCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-black">
                {kpis.lowStockItemsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/[0.1] bg-[#121212] p-3 shadow-2xl backdrop-blur-xl animate-fade-in z-50">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-semibold text-zinc-200">System Alerts</span>
                <span className="text-[11px] text-zinc-500">Live Telemetry</span>
              </div>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {kpis.lowStockItemsCount > 0 ? (
                  <div className="flex items-start gap-2.5 rounded-lg bg-amber-500/10 p-2.5 text-xs text-amber-200 border border-amber-500/20">
                    <IconAlertTriangle size={16} className="mt-0.5 text-amber-400 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-amber-300">
                        {kpis.lowStockItemsCount} Products Below Safety Reorder
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Inventory levels require immediate replenishment purchase orders.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-zinc-500">All inventory thresholds normal</div>
                )}
                <div className="rounded-lg bg-white/[0.03] p-2.5 text-xs text-zinc-300">
                  <p className="font-medium text-zinc-200">Pending Workflow Queue</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {kpis.pendingReceiptsCount} Receipts, {kpis.pendingDeliveriesCount} Deliveries waiting.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowQuickMenu(false);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 pr-2.5 transition-colors hover:bg-white/[0.06]"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-tr from-blue-600 to-indigo-500 text-xs font-bold text-white shadow-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden text-left md:block">
              <div className="text-xs font-medium text-zinc-200 leading-none">{currentUser.name}</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                <span className={`inline-block px-1.5 py-0.2 rounded ${getRoleBadgeStyle(currentUser.role)}`}>
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
            </div>
            <IconChevronDown size={13} className="text-zinc-500" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-white/[0.1] bg-[#121212] p-2 shadow-2xl backdrop-blur-xl animate-fade-in z-50">
              <div className="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Switch Role Profile (Hackathon Simulation)
              </div>
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setCurrentUser(u);
                    setShowRoleMenu(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                    currentUser.id === u.id ? 'bg-blue-600/10 text-blue-400 font-medium' : 'text-zinc-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <div>
                    <div className="font-medium text-zinc-200">{u.name}</div>
                    <div className="text-[10px] text-zinc-500">{u.email}</div>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${getRoleBadgeStyle(u.role)}`}>
                    {u.role.split('_')[0]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
