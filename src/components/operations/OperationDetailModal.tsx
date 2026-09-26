'use client';

import React, { useState } from 'react';
import { StockOperation, OperationStatus } from '@/lib/types';
import { useStock } from '@/lib/stockContext';
import { StatusBadge, TypeBadge } from './StatusBadge';
import {
  IconCross,
  IconCheck,
  IconWarehouse,
} from '@/components/ui/Icons';

interface OperationDetailModalProps {
  operation: StockOperation | null;
  onClose: () => void;
}

export function OperationDetailModal({ operation, onClose }: OperationDetailModalProps) {
  const { updateOperationStatus, locations, products, quants } = useStock();
  const [isActing, setIsActing] = useState(false);

  const handleStatusChange = async (newStatus: OperationStatus) => {
    setIsActing(true);
    try {
      const ok = await updateOperationStatus(operation!.id, newStatus);
      if (ok) onClose();
    } finally {
      setIsActing(false);
    }
  };

  if (!operation) return null;

  const getLocationName = (locId?: string | null) => {
    if (!locId) return 'External / Unknown';
    const loc = locations.find((l) => l.id === locId);
    return loc ? loc.name : 'Unknown';
  };

  const getSourceStock = (productId: string) => {
    if (!operation.sourceLocationId) return 0;
    const quant = quants.find(
      (q) => q.productId === productId && q.locationId === operation.sourceLocationId
    );
    return quant ? quant.quantity : 0;
  };

  const steps: OperationStatus[] = ['DRAFT', 'WAITING', 'READY', 'DONE'];

  const getStepIndex = (status: OperationStatus) => {
    return steps.indexOf(status);
  };

  const currentStepIdx = getStepIndex(operation.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/[0.1] bg-[#121214] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-white">
                {operation.referenceNumber}
              </span>
              <TypeBadge type={operation.type} />
              <StatusBadge status={operation.status} />
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Created on {new Date(operation.createdAt).toLocaleDateString()} • Scheduled for {operation.scheduledDate || 'Today'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/[0.05] hover:text-white transition-colors"
          >
            <IconCross size={16} />
          </button>
        </div>

        {/* Lifecycle Status Progress Tracker */}
        <div className="my-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const isPastOrCurrent = currentStepIdx >= idx;
              const isCurrent = operation.status === step;

              return (
                <div key={step} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-500/20'
                          : isPastOrCurrent
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {isPastOrCurrent && !isCurrent ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`mt-1.5 text-[10px] font-medium uppercase tracking-wider ${
                        isCurrent
                          ? 'text-blue-400 font-semibold'
                          : isPastOrCurrent
                          ? 'text-zinc-300'
                          : 'text-zinc-600'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`h-[2px] flex-1 mx-2 transition-all ${
                        currentStepIdx > idx ? 'bg-emerald-500' : 'bg-zinc-800'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Source / Destination Location Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Source Location
            </span>
            <div className="mt-1 flex items-center gap-2 text-xs font-medium text-zinc-200">
              <IconWarehouse size={14} className="text-zinc-400" />
              <span>{getLocationName(operation.sourceLocationId)}</span>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Destination Location
            </span>
            <div className="mt-1 flex items-center gap-2 text-xs font-medium text-zinc-200">
              <IconWarehouse size={14} className="text-blue-400" />
              <span>{getLocationName(operation.destLocationId)}</span>
            </div>
          </div>
        </div>

        {/* Operation Line Items */}
        <div className="mt-4">
          <div className="flex items-center justify-between pb-2 text-xs font-semibold text-zinc-300">
            <span>Product Move Lines</span>
            <span className="text-[11px] text-zinc-500">{operation.moves.length} Items</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.01]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.03] text-[10px] uppercase text-zinc-400">
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3 text-right">Transfer Qty</th>
                  {operation.sourceLocationId && (
                    <th className="py-2.5 px-3 text-right">Source Available</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {operation.moves.map((move) => {
                  const prod = products.find((p) => p.id === move.productId);
                  const availableStock = getSourceStock(move.productId);

                  return (
                    <tr key={move.id}>
                      <td className="py-2.5 px-3 font-mono text-zinc-400">{prod?.sku || 'N/A'}</td>
                      <td className="py-2.5 px-3 font-medium text-zinc-200">{prod?.name || 'Item'}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">
                        {move.qty} {prod?.uom || 'Units'}
                      </td>
                      {operation.sourceLocationId && (
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`font-medium ${
                              availableStock >= move.qty ? 'text-emerald-400' : 'text-rose-400 font-bold'
                            }`}
                          >
                            {availableStock}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        {operation.notes && (
          <div className="mt-3 rounded-lg bg-white/[0.02] p-2.5 border border-white/[0.04] text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300">Notes: </span>
            {operation.notes}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-4">
          <div>
            {operation.status !== 'DONE' && operation.status !== 'CANCELED' && (
              <button
                disabled={isActing}
                onClick={() => handleStatusChange('CANCELED')}
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
              >
                {isActing ? 'Processing…' : 'Cancel Operation'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-white/[0.1] px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.05] transition-colors"
            >
              Close
            </button>

            {operation.status === 'DRAFT' && (
              <button
                disabled={isActing}
                onClick={() => handleStatusChange('READY')}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {isActing ? 'Processing…' : 'Mark as Ready'}
              </button>
            )}

            {(operation.status === 'READY' || operation.status === 'WAITING') && (
              <button
                disabled={isActing}
                onClick={() => handleStatusChange('DONE')}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                <IconCheck size={14} />
                <span>{isActing ? 'Validating…' : 'Validate & Complete'}</span>
              </button>
            )}

            {operation.status === 'DONE' && (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                <IconCheck size={14} />
                <span>Posted to Stock Ledger</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
