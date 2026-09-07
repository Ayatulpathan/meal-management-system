import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UtensilsCrossed, 
  ShoppingCart, 
  Wallet,
  FileSpreadsheet
} from 'lucide-react';

const mobileNavItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Meals', path: '/meals', icon: UtensilsCrossed },
  { name: 'Members', path: '/members', icon: Users },
  { name: 'Market', path: '/market-costs', icon: ShoppingCart },
  { name: 'Deposits', path: '/deposits', icon: Wallet },
  { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
];

export const MobileNavigation = () => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-1 shadow-lg no-print">
      <div className="flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-emerald-600 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
