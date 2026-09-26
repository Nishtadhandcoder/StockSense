'use client';

import React from 'react';
import { StockProvider } from '@/lib/stockContext';
import { AppShell } from '@/components/layout/AppShell';

export default function Home() {
  return (
    <StockProvider>
      <AppShell />
    </StockProvider>
  );
}
