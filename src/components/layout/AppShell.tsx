'use client';

import React, { useState } from 'react';
import { Sidebar, NavigationTab } from './Sidebar';
import { TopHeader } from './TopHeader';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { LowStockAlerts } from '@/components/dashboard/LowStockAlerts';
import { OperationsSummary } from '@/components/dashboard/OperationsSummary';
import { OperationsTable } from '@/components/operations/OperationsTable';
import { OperationDetailModal } from '@/components/operations/OperationDetailModal';
import { ReceiptWorkflowForm } from '@/components/forms/ReceiptWorkflowForm';
import { DeliveryWorkflowForm } from '@/components/forms/DeliveryWorkflowForm';
import { TransferWorkflowForm } from '@/components/forms/TransferWorkflowForm';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { LocationsView } from '@/components/locations/LocationsView';
import { LedgerTable } from '@/components/ledger/LedgerTable';
import { StockOperation, OperationType, Product, OperationStatus } from '@/lib/types';
import {
  IconReceipt,
  IconDelivery,
  IconTransfer,
  IconChevronRight,
  IconSparkles,
} from '@/components/ui/Icons';

export function AppShell() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedOperation, setSelectedOperation] = useState<StockOperation | null>(null);
  const [activeModal, setActiveModal] = useState<'NONE' | 'RECEIPT' | 'DELIVERY' | 'TRANSFER'>('NONE');
  const [preselectedProduct, setPreselectedProduct] = useState<Product | null>(null);

  const handleOpenNewOperation = (type: OperationType) => {
    setPreselectedProduct(null);
    if (type === 'RECEIPT') setActiveModal('RECEIPT');
    else if (type === 'DELIVERY') setActiveModal('DELIVERY');
    else if (type === 'INTERNAL') setActiveModal('TRANSFER');
  };

  const handleRestockProduct = (product: Product) => {
    setPreselectedProduct(product);
    setActiveModal('RECEIPT');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-zinc-100 font-sans">
      {/* Left Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <TopHeader
          onOpenNewOperation={handleOpenNewOperation}
          searchQuery={globalSearch}
          setSearchQuery={setGlobalSearch}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* Executive Welcome & Operations Trigger Bar */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    Operations Intelligence
                    <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
                      <IconSparkles size={13} />
                      Live Sync
                    </span>
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    Real-time KPIs, inventory movement telemetry, and active workflow queue
                  </p>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleOpenNewOperation('RECEIPT')}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 hover:scale-[1.02]"
                  >
                    <IconReceipt size={15} />
                    <span>+ New Receipt</span>
                  </button>
                  <button
                    onClick={() => handleOpenNewOperation('DELIVERY')}
                    className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-300 transition-all hover:bg-blue-500/20 hover:scale-[1.02]"
                  >
                    <IconDelivery size={15} />
                    <span>+ New Delivery</span>
                  </button>
                  <button
                    onClick={() => handleOpenNewOperation('INTERNAL')}
                    className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-purple-300 transition-all hover:bg-purple-500/20 hover:scale-[1.02]"
                  >
                    <IconTransfer size={15} />
                    <span>+ Internal Transfer</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <KpiCards />

              {/* Critical Low Stock Alert Banner */}
              <LowStockAlerts onRestockProduct={handleRestockProduct} />

              {/* Facility Allocation & Pipeline Health */}
              <OperationsSummary
                onFilterStatus={(status) => {
                  setCurrentTab('operations');
                }}
              />

              {/* Recent Operations Activity Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between pb-3">
                  <h3 className="text-base font-bold text-white">Active Warehouse Operations</h3>
                  <button
                    onClick={() => setCurrentTab('operations')}
                    className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <span>View All Operations</span>
                    <IconChevronRight size={14} />
                  </button>
                </div>
                <OperationsTable
                  initialTypeFilter="ALL"
                  onSelectOperation={setSelectedOperation}
                  onOpenNewOperation={handleOpenNewOperation}
                />
              </div>
            </div>
          )}

          {/* TAB 2: ALL OPERATIONS */}
          {currentTab === 'operations' && (
            <div className="animate-fade-in">
              <OperationsTable
                initialTypeFilter="ALL"
                onSelectOperation={setSelectedOperation}
                onOpenNewOperation={handleOpenNewOperation}
                title="All Operations Master Index"
                subtitle="Complete operational workflow across inbound receipts, customer delivery orders, and location relocations"
              />
            </div>
          )}

          {/* TAB 3: INBOUND RECEIPTS */}
          {currentTab === 'receipts' && (
            <div className="animate-fade-in">
              <OperationsTable
                initialTypeFilter="RECEIPT"
                onSelectOperation={setSelectedOperation}
                onOpenNewOperation={handleOpenNewOperation}
                title="Inbound Goods Receipts (PO Intake)"
                subtitle="Vendor intake lifecycle: Validate arriving purchase orders and stage into warehouse storage racks"
              />
            </div>
          )}

          {/* TAB 4: DELIVERY ORDERS */}
          {currentTab === 'deliveries' && (
            <div className="animate-fade-in">
              <OperationsTable
                initialTypeFilter="DELIVERY"
                onSelectOperation={setSelectedOperation}
                onOpenNewOperation={handleOpenNewOperation}
                title="Outbound Delivery Orders (Customer Dispatch)"
                subtitle="Pick, pack, and ship orders to external clients with live inventory reservation checks"
              />
            </div>
          )}

          {/* TAB 5: INTERNAL TRANSFERS */}
          {currentTab === 'transfers' && (
            <div className="animate-fade-in">
              <OperationsTable
                initialTypeFilter="INTERNAL"
                onSelectOperation={setSelectedOperation}
                onOpenNewOperation={handleOpenNewOperation}
                title="Internal Stock Transfers"
                subtitle="Move products between storage racks, staging bays, or multi-hub facility shuttles"
              />
            </div>
          )}

          {/* TAB 6: INVENTORY & QUANTS */}
          {currentTab === 'inventory' && (
            <div className="animate-fade-in">
              <InventoryTable onRestockProduct={handleRestockProduct} />
            </div>
          )}

          {/* TAB 7: WAREHOUSES & LOCATIONS */}
          {currentTab === 'locations' && (
            <div className="animate-fade-in">
              <LocationsView />
            </div>
          )}

          {/* TAB 8: AUDIT LEDGER */}
          {currentTab === 'ledger' && (
            <div className="animate-fade-in">
              <LedgerTable />
            </div>
          )}
        </main>
      </div>

      {/* Operation Detail Modal */}
      <OperationDetailModal
        operation={selectedOperation}
        onClose={() => setSelectedOperation(null)}
      />

      {/* Workflow Form Modals */}
      <ReceiptWorkflowForm
        isOpen={activeModal === 'RECEIPT'}
        onClose={() => {
          setActiveModal('NONE');
          setPreselectedProduct(null);
        }}
        preselectedProduct={preselectedProduct}
      />

      <DeliveryWorkflowForm
        isOpen={activeModal === 'DELIVERY'}
        onClose={() => setActiveModal('NONE')}
      />

      <TransferWorkflowForm
        isOpen={activeModal === 'TRANSFER'}
        onClose={() => setActiveModal('NONE')}
      />

      {/* Toast Feedback Notifications */}
      <ToastContainer />
    </div>
  );
}
