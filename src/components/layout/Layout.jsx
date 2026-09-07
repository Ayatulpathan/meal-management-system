import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNavigation } from './MobileNavigation';
import { useMonthContext } from '../../context/MonthContext';
import { Lock } from 'lucide-react';

export const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isClosed, currentMonthData } = useMonthContext();

  return (
    <div className="flex h-screen bg-slate-100/70 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-10 shadow-2xl">
            <Sidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Global Closed Month Alert Banner */}
        {isClosed && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-amber-900 text-xs font-medium flex items-center justify-center gap-2 no-print">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>{currentMonthData?.monthName}</strong> is closed. All meal records, market costs, and deposits are in read-only mode.
            </span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        <MobileNavigation />
      </div>
    </div>
  );
};
