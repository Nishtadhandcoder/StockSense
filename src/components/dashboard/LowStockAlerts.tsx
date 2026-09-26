'use client';

import React from 'react';
import { useStock } from '@/lib/stockContext';
import { IconAlertTriangle, IconPlus } from '@/components/ui/Icons';
import { Product } from '@/lib/types';

interface LowStockAlertsProps {
  onRestockProduct: (product: Product) => void;
}

export function LowStockAlerts({ onRestockProduct }: LowStockAlertsProps) {
  const { products, getProductStock, selectedWarehouseId } = useStock();

  const lowStockItems = products
    .map((prod) => {
      const currentStock = getProductStock(prod.id, selectedWarehouseId);
      return {
        product: prod,
        currentStock,
        deficit: Math.max(0, prod.minReorderLevel - currentStock),
        isLow: currentStock <= prod.minReorderLevel,
      };
    })
    .filter((item) => item.isLow)
    .sort((a, b) => b.deficit - a.deficit);

  if (lowStockItems.length === 0) {
    return (
      <div className="glass-card flex items-center justify-between p-4 border-emerald-500/20 bg-emerald-950/10">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            ✓
          </div>
          <div>
            <h4 className="text-xs font-semibold text-emerald-300">All Inventory Thresholds Healthy</h4>
            <p className="text-[11px] text-zinc-400">No items are currently below minimum safety stock buffers.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 border-amber-500/30 bg-amber-950/10">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/20 text-amber-400">
            <IconAlertTriangle size={15} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              Critical Low Stock Reorder Triggers
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                {lowStockItems.length} Products
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Automated reorder buffer recommendations based on minimum threshold limits.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 divide-y divide-white/[0.05]">
        {lowStockItems.map(({ product, currentStock, deficit }) => (
          <div key={product.id} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-xs font-mono font-bold text-zinc-300">
                {product.category.slice(0, 3).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-200">{product.name}</div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                  <span className="font-mono text-zinc-500">{product.sku}</span>
                  <span>•</span>
                  <span>Safety Buffer: {product.minReorderLevel} {product.uom}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs font-bold text-rose-400">
                  {currentStock} {product.uom} left
                </div>
                <div className="text-[10px] text-amber-400/90 font-medium">
                  -{deficit} under threshold
                </div>
              </div>

              <button
                onClick={() => onRestockProduct(product)}
                className="flex items-center gap-1 rounded-lg bg-blue-600/90 hover:bg-blue-500 px-2.5 py-1.5 text-[11px] font-medium text-white transition-colors shadow-sm"
              >
                <IconPlus size={12} />
                <span>Create PO Receipt</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
