'use client';

import React, { useState } from 'react';
import { useStock } from '@/lib/stockContext';
import { IconLedger, IconSearch } from '@/components/ui/Icons';

export function LedgerTable() {
  const { ledger, products, locations, operations } = useStock();

  const [search, setSearch] = useState('');

  const getLocationName = (locId?: string | null) => {
    if (!locId) return 'External / Unknown';
    const loc = locations.find((l) => l.id === locId);
    return loc ? loc.name : 'Unknown';
  };

  const getOpRef = (opId?: string | null) => {
    if (!opId) return 'Manual Adjustment';
    const op = operations.find((o) => o.id === opId);
    return op ? op.referenceNumber : opId;
  };

  const filteredLedger = ledger.filter((entry) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const prod = products.find((p) => p.id === entry.productId);
    const opRef = getOpRef(entry.operationId);
    const src = getLocationName(entry.sourceLocationId);
    const dst = getLocationName(entry.destLocationId);

    return (
      prod?.name.toLowerCase().includes(q) ||
      prod?.sku.toLowerCase().includes(q) ||
      opRef.toLowerCase().includes(q) ||
      src.toLowerCase().includes(q) ||
      dst.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">Stock Ledger & Audit Trail</h2>
        <p className="text-xs text-zinc-400">
          Append-only immutable record of all validated inventory entries and physical stock relocations
        </p>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#121212]/80 p-3 backdrop-blur-md">
        <div className="relative min-w-[280px] flex-1">
          <IconSearch size={15} className="absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by operation reference, SKU, or storage location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-1.5 pl-9 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-blue-500/50 focus:outline-none"
          />
        </div>
        <div className="text-xs text-zinc-400 font-mono">
          {filteredLedger.length} Verified Entries
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-card overflow-hidden p-0 border border-white/[0.08]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] uppercase tracking-wider text-zinc-400">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Reference Document</th>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Source Location</th>
                <th className="py-3 px-4">Destination Location</th>
                <th className="py-3 px-4 text-right">Units Transferred</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs font-mono">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No ledger entries found.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((entry) => {
                  const prod = products.find((p) => p.id === entry.productId);
                  const opRef = getOpRef(entry.operationId);

                  return (
                    <tr key={entry.id} className="hover:bg-white/[0.03] transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-4 text-zinc-400 text-[11px]">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>

                      {/* Reference Document */}
                      <td className="py-3 px-4">
                        <span className="rounded bg-white/[0.04] px-2 py-0.5 text-zinc-300 font-semibold border border-white/[0.05]">
                          {opRef}
                        </span>
                      </td>

                      {/* Product */}
                      <td className="py-3 px-4 font-sans">
                        <div className="font-semibold text-zinc-200">{prod?.name || 'Product'}</div>
                        <div className="font-mono text-[10px] text-zinc-400">{prod?.sku || entry.productId}</div>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4 font-sans text-zinc-300">
                        {getLocationName(entry.sourceLocationId)}
                      </td>

                      {/* Destination */}
                      <td className="py-3 px-4 font-sans text-zinc-200">
                        {getLocationName(entry.destLocationId)}
                      </td>

                      {/* Qty */}
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">
                        +{entry.qty} {prod?.uom || 'Units'}
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
