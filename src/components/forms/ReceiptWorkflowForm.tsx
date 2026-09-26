'use client';

import React, { useState } from 'react';
import { useStock } from '@/lib/stockContext';
import { Product } from '@/lib/types';
import { IconCross, IconPlus, IconReceipt, IconCheck } from '@/components/ui/Icons';

interface ReceiptWorkflowFormProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProduct?: Product | null;
}

export function ReceiptWorkflowForm({ isOpen, onClose, preselectedProduct }: ReceiptWorkflowFormProps) {
  const { locations, products, createOperation, updateOperationStatus, showToast } = useStock();

  const internalLocations = locations.filter((l) => l.isInternal);
  const vendorLocation = locations.find((l) => !l.isInternal && l.id === 'loc-vendor') || locations[0];

  const [destLocationId, setDestLocationId] = useState<string>(
    internalLocations[0]?.id || ''
  );
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('Vendor delivery shipment PO-2026');

  const [items, setItems] = useState<Array<{ productId: string; qty: number }>>(() => {
    if (preselectedProduct) {
      return [{ productId: preselectedProduct.id, qty: preselectedProduct.minReorderLevel * 2 }];
    }
    return [{ productId: products[0]?.id || '', qty: 10 }];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productId: products[0]?.id || '', qty: 10 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      showToast('Receipt must have at least one line item.', 'error');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleItemChange = (index: number, field: 'productId' | 'qty', value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: field === 'qty' ? Math.max(1, Number(value)) : value };
      return copy;
    });
  };

  const handleSubmit = async (autoValidate: boolean = false) => {
    if (!destLocationId) {
      showToast('Please select a destination storage location.', 'error');
      return;
    }
    if (items.length === 0) {
      showToast('Please add at least one product.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const newOp = await createOperation({
        type: 'RECEIPT',
        sourceLocationId: vendorLocation?.id || null,
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
      // error already shown via showToast inside createOperation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/[0.1] bg-[#121214] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <IconReceipt size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Inbound Goods Receipt</h3>
              <p className="text-xs text-zinc-400">Intake products from vendor into warehouse inventory</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
            <IconCross size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-5 space-y-4">
          {/* Warehouse Location & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Destination Storage Location *
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

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Scheduled Intake Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between pb-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Line Items ({items.length})
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300"
              >
                <IconPlus size={13} />
                <span>Add Product</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((item, index) => {
                const prod = products.find((p) => p.id === item.productId);

                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5"
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

                    <div className="w-28">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                          className="py-1.5 text-xs font-bold text-center"
                        />
                        <span className="text-[11px] text-zinc-400">{prod?.uom || 'Units'}</span>
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

          {/* Notes */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Vendor PO Reference & Instructions
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. PO-9842 from TechSupply Logistics"
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
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/[0.08] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Save as Draft'}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 disabled:opacity-50"
            >
              <IconCheck size={14} />
              <span>{isSubmitting ? 'Processing…' : 'Validate & Intake Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
