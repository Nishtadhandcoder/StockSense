'use client';

import React, { useState } from 'react';
import { useStock } from '@/lib/stockContext';
import { Product } from '@/lib/types';
import { IconSearch, IconPlus } from '@/components/ui/Icons';

interface InventoryTableProps {
  onRestockProduct: (product: Product) => void;
}

export function InventoryTable({ onRestockProduct }: InventoryTableProps) {
  const { products, getProductStock, getProductQuantsByLocation, selectedWarehouseId } = useStock();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      if (!matchName && !matchSku) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Stock Quantities & SKUs</h2>
          <p className="text-xs text-zinc-400">
            Real-time multi-location inventory ledger and safety reorder monitoring
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#121212]/80 p-3 backdrop-blur-md">
        <div className="relative min-w-[240px] flex-1">
          <IconSearch size={15} className="absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search SKU, product title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-1.5 pl-9 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-blue-500/50 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 bg-white/[0.02]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-card overflow-hidden p-0 border border-white/[0.08]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] uppercase tracking-wider text-zinc-400">
                <th className="py-3 px-4">SKU / Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Stock on Hand</th>
                <th className="py-3 px-4">Safety Buffer</th>
                <th className="py-3 px-4">Location Breakdown</th>
                <th className="py-3 px-4 text-right">Asset Value</th>
                <th className="py-3 px-4 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {filteredProducts.map((prod) => {
                const stock = getProductStock(prod.id, selectedWarehouseId);
                const isLow = stock <= prod.minReorderLevel;
                const locBreakdown = getProductQuantsByLocation(prod.id);
                const assetValue = stock * (prod.unitPrice || 0);

                return (
                  <tr key={prod.id} className="hover:bg-white/[0.03] transition-colors">
                    {/* SKU & Name */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-semibold text-zinc-100">{prod.name}</div>
                        <div className="font-mono text-[11px] text-zinc-400">{prod.sku}</div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                        {prod.category}
                      </span>
                    </td>

                    {/* Stock on Hand */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold ${
                            isLow ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {stock}
                        </span>
                        <span className="text-[11px] text-zinc-500">{prod.uom}</span>
                        {isLow && (
                          <span className="rounded bg-rose-500/20 px-1.5 py-0.2 text-[9px] font-bold text-rose-300 border border-rose-500/30">
                            LOW
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Min Reorder */}
                    <td className="py-3.5 px-4 text-zinc-400">
                      {prod.minReorderLevel} {prod.uom}
                    </td>

                    {/* Location Breakdown */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {locBreakdown.map((item) => (
                          <span
                            key={item.location.id}
                            className="inline-flex items-center gap-1 rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-zinc-300"
                          >
                            <span className="text-zinc-500">{item.location.name}:</span>
                            <span className="font-semibold text-zinc-200">{item.quantity}</span>
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Asset Value */}
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-zinc-200">
                      ${assetValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Restock Button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onRestockProduct(prod)}
                        className="rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-2.5 py-1 text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                      >
                        <IconPlus size={11} />
                        <span>Restock</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
