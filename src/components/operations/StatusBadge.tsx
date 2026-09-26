import React from 'react';
import { OperationStatus, OperationType } from '@/lib/types';

export function StatusBadge({ status }: { status: OperationStatus }) {
  const configs: Record<OperationStatus, { label: string; bg: string; text: string; dot: string; border: string }> = {
    DRAFT: {
      label: 'Draft',
      bg: 'bg-zinc-800/80',
      text: 'text-zinc-400',
      dot: 'bg-zinc-500',
      border: 'border-zinc-700/60',
    },
    WAITING: {
      label: 'Waiting Availability',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      dot: 'bg-amber-400 animate-pulse',
      border: 'border-amber-500/30',
    },
    READY: {
      label: 'Ready to Process',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      dot: 'bg-blue-400',
      border: 'border-blue-500/30',
    },
    DONE: {
      label: 'Completed',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
      border: 'border-emerald-500/30',
    },
    CANCELED: {
      label: 'Canceled',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      dot: 'bg-rose-400',
      border: 'border-rose-500/30',
    },
  };

  const c = configs[status] || configs.DRAFT;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${c.bg} ${c.text} ${c.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

export function TypeBadge({ type }: { type: OperationType }) {
  const configs: Record<OperationType, { label: string; bg: string; text: string; border: string }> = {
    RECEIPT: {
      label: 'Inbound Receipt',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
    },
    DELIVERY: {
      label: 'Delivery Order',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/20',
    },
    INTERNAL: {
      label: 'Internal Transfer',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/20',
    },
    ADJUSTMENT: {
      label: 'Stock Adjustment',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
    },
  };

  const c = configs[type] || configs.INTERNAL;

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${c.bg} ${c.text} ${c.border}`}
    >
      {c.label}
    </span>
  );
}
