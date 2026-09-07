import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UtensilsCrossed, 
  ShoppingCart, 
  Wallet, 
  FileSpreadsheet, 
  Settings as SettingsIcon, 
  LogOut,
  Sparkles,
  Lock,
  UserCheck
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useMonthContext } from '../../context/MonthContext';

export const Sidebar = ({ onClose }) => {
  const { logout, user, isAdmin, isMember } = useAuthContext();
  const { isClosed, currentMonthData } = useMonthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const adminNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Meal Entry Grid', path: '/meals', icon: UtensilsCrossed },
    { name: 'Market Cost', path: '/market-costs', icon: ShoppingCart },
    { name: 'Deposits', path: '/deposits', icon: Wallet },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  const memberNavItems = [
    { name: 'My Member Portal', path: '/portal', icon: UserCheck },
    { name: 'Spreadsheet Grid', path: '/meals', icon: UtensilsCrossed },
    { name: 'Market Expenses', path: '/market-costs', icon: ShoppingCart },
    { name: 'Deposits Ledger', path: '/deposits', icon: Wallet },
    { name: 'Monthly Reports', path: '/reports', icon: FileSpreadsheet },
  ];

  const navigationItems = isMember ? memberNavItems : adminNavItems;

  return (
    <aside className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <UtensilsCrossed className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide">MealManager</h1>
          <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> {isMember ? 'Member Portal' : 'Admin Console'}
          </p>
        </div>
      </div>

      {/* Month Status Badge in Sidebar */}
      {isClosed && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <span className="font-semibold block">{currentMonthData?.monthName}</span>
            <span className="text-[10px] text-amber-400/80">Month is closed (Read-only)</span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${isMember ? 'bg-teal-500/20 text-teal-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.displayName || 'User'}
                </p>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${isMember ? 'bg-teal-500/20 text-teal-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                  {isMember ? 'Member' : 'Admin'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email || 'user@mealmanager.com'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
