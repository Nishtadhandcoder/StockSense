'use client';

import React from 'react';
import { useStock } from '@/lib/stockContext';
import { IconWarehouse } from '@/components/ui/Icons';

export function LocationsView() {
  const { warehouses, locations, quants, products } = useStock();

  const getLocationStock = (locId: string) => {
    return quants
      .filter((q) => q.locationId === locId)
      .reduce((sum, q) => sum + q.quantity, 0);
  };

  const getLocationProducts = (locId: string) => {
    return quants
      .filter((q) => q.locationId === locId && q.quantity > 0)
      .map((q) => {
        const prod = products.find((p) => p.id === q.productId);
        return {
          product: prod,
          quantity: q.quantity,
        };
      });
  };

  const externalLocations = locations.filter((l) => !l.isInternal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">Warehouses & Storage Topology</h2>
        <p className="text-xs text-zinc-400">
          Facility zones, receiving bays, and external partner boundary points
        </p>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {warehouses.map((wh) => {
          const whLocations = locations.filter((l) => l.warehouseId === wh.id);
          const totalWhStock = whLocations.reduce((sum, l) => sum + getLocationStock(l.id), 0);

          return (
            <div key={wh.id} className="glass-card p-5 border-white/[0.08]">
              {/* Warehouse Title */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <IconWarehouse size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{wh.name}</h3>
                    <span className="font-mono text-[10px] text-blue-400 font-semibold">
                      CODE: {wh.code}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">{totalWhStock} Units</div>
                  <div className="text-[10px] text-zinc-400">{whLocations.length} Active Zones</div>
                </div>
              </div>

              {/* Internal Zones */}
              <div className="mt-4 space-y-3">
                {whLocations.map((loc) => {
                  const stock = getLocationStock(loc.id);
                  const items = getLocationProducts(loc.id);

                  return (
                    <div
                      key={loc.id}
                      className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <span className="text-xs font-semibold text-zinc-200">{loc.name}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-zinc-300">
                          {stock} units
                        </span>
                      </div>

                      {/* Items stored in this zone */}
                      {items.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {items.map(({ product, quantity }) => (
                            <span
                              key={product?.id}
                              className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-zinc-300"
                            >
                              <span className="text-zinc-500">{product?.sku}:</span> {quantity}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-1.5 text-[10px] text-zinc-500 italic">Zone empty</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* External Locations Card */}
      <div className="glass-card p-5 border-white/[0.08]">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div>
            <h3 className="text-sm font-bold text-white">External Ecosystem Endpoints</h3>
            <p className="text-[11px] text-zinc-400">
              Virtual gateway locations for receiving from vendors and shipping to customers
            </p>
          </div>
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
            External Entities
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {externalLocations.map((loc) => (
            <div
              key={loc.id}
              className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-3"
            >
              <div>
                <span className="text-xs font-semibold text-zinc-200">{loc.name}</span>
                <p className="text-[10px] text-zinc-500">
                  {loc.id === 'loc-vendor' ? 'Inbound PO Origin' : 'Outbound Customer Destination'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">isInternal: false</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
