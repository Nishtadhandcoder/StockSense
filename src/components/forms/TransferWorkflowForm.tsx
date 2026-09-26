'use client';

import React, { useState, useCallback } from 'react';
import { useStock } from '@/lib/stockContext';
import { IconCross, IconPlus, IconTransfer, IconCheck, IconAlertTriangle } from '@/components/ui/Icons';

interface TransferWorkflowFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransferWorkflowForm({ isOpen, onClose }: TransferWorkflowFormProps) {
  const { locations, products, quants, createOperation, updateOperationStatus, showToast } = useStock();

  const internalLocations = locations.filter((l) => l.isInternal);

  const [sourceLocationId, setSourceLocationId] = useState<string>(
    internalLocations[0]?.id || ''
  );
  const [destLocationId, setDestLocationId] = useState<string>(
    internalLocations[1]?.id || ''
  );
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('Inter-bay stock rebalancing transfer');

  const [items, setItems] = useState<Array<{ productId: string; qty: number }>>([
    { productId: products[0]?.id || '', qty: 5 },
  ]);

  if (!isOpen) return null;

  const getAvailableStock = (prodId: string, locId: string) => {
    const quant = quants.find((q) => q.productId === prodId && q.locationId === locId);
    return quant ? quant.quantity : 0;
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productId: products[0]?.id || '', qty: 5 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      showToast('Transfer must have at least one line item.', 'error');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'qty', value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: field === 'qty' ? Math.max(1, Number(value)) : value };
      return copy;
    });
  };

  const isSameLocation = sourceLocationId === destLocationId;

  const hasInsufficientStock = items.some((item) => {
    const available = getAvailableStock(item.productId, sourceLocationId);
    return item.qty > available;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (autoValidate: boolean = false) => {
    if (isSameLocation) {
      showToast('Source and Destination locations must be different.', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Please add at least one line item.', 'error');
      return;
    }
    if (autoValidate && hasInsufficientStock) {
      showToast('Cannot transfer: requested quantity exceeds available balance in source zone.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const newOp = await createOperation({
        type: 'INTERNAL',
        sourceLocationId,
        destLocationId,
        scheduledDate,
        notes,
        moves: items,
      });

      if (autoValidate) {
        await updateOperationStatus(newOp.id, 'DONE');
      }

      onClose();
    } catch {
      // error shown via showToast
    } finally {
      setIsSubmitting(false);
    }
  }, [isSameLocation, items, hasInsufficientStock, sourceLocationId, destLocationId,
      scheduledDate, notes, createOperation, updateOperationStatus, showToast, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/[0.1] bg-[#121214] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <IconTransfer size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Internal Stock Transfer</h3>
              <p className="text-xs text-zinc-400">Move inventory between warehouse racks, bays, or hub facilities</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
            <IconCross size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-5 space-y-4">
          {/* Source & Destination Locations */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Source Location *
              </label>
              <select
                value={sourceLocationId}
                onChange={(e) => setSourceLocationId(e.target.value)}
                className="mt-1.5"
              >
                {internalLocations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-[#121212]">
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Target Destination Location *
              </label>
              <select
                value={destLocationId}
                onChange={(e) => setDestLocationId(e.target.value)}
                className="mt-1.5"
              >
                {internalLocations.map((loc) => (
                  <option key={loc.id} value={loc.id} className="bg-[#121212]">
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isSameLocation && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2 text-xs text-rose-300">
              Destination location cannot be identical to source location.
            </div>
          )}

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between pb-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Transfer Items ({items.length})
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-[11px] font-medium text-purple-400 hover:text-purple-300"
              >
                <IconPlus size={13} />
                <span>Add Product</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((item, index) => {
                const prod = products.find((p) => p.id === item.productId);
                const available = getAvailableStock(item.productId, sourceLocationId);
                const isShort = item.qty > available;

                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 rounded-xl border p-2.5 transition-colors ${
                      isShort
                        ? 'border-rose-500/40 bg-rose-950/20'
                        : 'border-white/[0.06] bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex-1">
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                        className="py-1.5 text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id} className="bg-[#121212]">
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-40 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                          className={`w-16 py-1.5 text-xs font-bold text-center ${
                            isShort ? 'border-rose-500 text-rose-300' : ''
                          }`}
                        />
                        <span className="text-[11px] text-zinc-400">{prod?.uom || 'Units'}</span>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-zinc-500">Source:</div>
                        <div
                          className={`text-xs font-mono font-bold ${
                            available >= item.qty ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {available}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                    >
                      <IconCross size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Insufficient Stock Warning */}
          {hasInsufficientStock && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-300">
              <IconAlertTriangle size={15} className="text-rose-400 flex-shrink-0" />
              <span>
                One or more transfer items exceed available source zone balance.
              </span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Transfer Reason & Logistic Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Relocating keyboards to high-density staging rack"
              className="mt-1.5 py-2 text-xs"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/[0.1] px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.05]"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSameLocation || isSubmitting}
              onClick={() => handleSubmit(false)}
              className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/[0.08] disabled:opacity-40"
            >
              {isSubmitting ? 'Saving…' : 'Save as Draft'}
            </button>
            <button
              type="button"
              disabled={isSameLocation || hasInsufficientStock || isSubmitting}
              onClick={() => handleSubmit(true)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all ${
                isSameLocation || hasInsufficientStock || isSubmitting
                  ? 'bg-zinc-700 opacity-50 cursor-not-allowed'
                  : 'bg-purple-600 shadow-purple-600/25 hover:bg-purple-500'
              }`}
            >
              <IconCheck size={14} />
              <span>{isSubmitting ? 'Processing…' : 'Transfer & Validate Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
