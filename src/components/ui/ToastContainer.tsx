'use client';

import React from 'react';
import { useStock } from '@/lib/stockContext';
import { IconCheck, IconAlertTriangle, IconCross } from '@/components/ui/Icons';

export function ToastContainer() {
  const { toasts, dismissToast } = useStock();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl p-3.5 shadow-2xl backdrop-blur-xl border transition-all animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/30 text-rose-200'
              : 'bg-zinc-900/90 border-white/[0.1] text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <IconCheck size={13} />
              </div>
            )}
            {toast.type === 'error' && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                <IconAlertTriangle size={13} />
              </div>
            )}
            <span className="text-xs font-medium leading-snug">{toast.message}</span>
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-zinc-400 hover:text-white transition-colors p-0.5"
          >
            <IconCross size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
