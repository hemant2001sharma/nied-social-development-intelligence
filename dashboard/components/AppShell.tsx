'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { DetailDrawer } from './DetailDrawer';
import { ExportModal } from './ExportModal';
import { OpportunityItem } from '@/types/intelligence';
import { fetchOpportunities, updateWatchlistStatus } from '@/lib/data';

interface AppContextType {
  items: OpportunityItem[];
  isLoading: boolean;
  error: string | null;
  selectedItem: OpportunityItem | null;
  selectItem: (item: OpportunityItem | null) => void;
  toggleWatchlist: (id: string, currentState: boolean) => void;
  refreshData: () => Promise<void>;
  openExportModal: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppIntelligence() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppIntelligence must be used within an AppShell provider');
  }
  return context;
}

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [items, setItems] = useState<OpportunityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<OpportunityItem | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    const { data, error } = await fetchOpportunities();
    if (error) {
      setError(error);
    } else {
      setItems(data);
      setError(null);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 15-minute background auto-sync polling
  useEffect(() => {
    if (!autoSync) return;
    const interval = setInterval(() => {
      loadData();
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoSync]);

  const handleToggleWatchlist = async (id: string, currentState: boolean) => {
    const nextState = !currentState;
    // Optimistic local state update
    setItems(prev => prev.map(item => item.id === id ? { ...item, is_watchlisted: nextState } : item));
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem(prev => prev ? { ...prev, is_watchlisted: nextState } : null);
    }
    await updateWatchlistStatus(id, nextState);
  };

  const highPriorityCount = items.filter(i => i.is_watchlisted || i.priority === 'HIGH').length;

  return (
    <AppContext.Provider
      value={{
        items,
        isLoading,
        error,
        selectedItem,
        selectItem: setSelectedItem,
        toggleWatchlist: handleToggleWatchlist,
        refreshData: loadData,
        openExportModal: () => setIsExportOpen(true)
      }}
    >
      <div className="min-h-screen bg-[#F4F7F9] flex flex-col text-[#17232E]">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          itemCount={items.length}
          highPriorityCount={highPriorityCount}
        />

        {/* Main Content Area */}
        <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
          <Topbar
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onRefresh={loadData}
            isRefreshing={isRefreshing}
            onOpenExport={() => setIsExportOpen(true)}
            autoSyncEnabled={autoSync}
            onToggleAutoSync={() => setAutoSync(!autoSync)}
          />

          <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Right-Side Sliding Detail Drawer */}
        <DetailDrawer
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onToggleWatchlist={handleToggleWatchlist}
        />

        {/* Export Modal */}
        <ExportModal
          items={items}
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
        />
      </div>
    </AppContext.Provider>
  );
}
