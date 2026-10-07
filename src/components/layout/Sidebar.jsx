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
  UserCheck,
  MessageSquare,
  Building2
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useMonthContext } from '../../context/MonthContext';
import { useChatContext } from '../../context/ChatContext';

export const Sidebar = ({ onClose }) => {
  const { logout, user, isAdmin, isMember } = useAuthContext();
  const { isClosed, currentMonthData } = useMonthContext();
  const { unreadCount } = useChatContext();
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
    { name: 'House Rent & Utility', path: '/rent-utilities', icon: Building2 },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { name: 'Mess Chat', path: '/chat', icon: MessageSquare },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  const memberNavItems = [
    { name: 'My Member Portal', path: '/portal', icon: UserCheck },
    { name: 'Spreadsheet Grid', path: '/meals', icon: UtensilsCrossed },
    { name: 'Market Expenses', path: '/market-costs', icon: ShoppingCart },
    { name: 'Deposits Ledger', path: '/deposits', icon: Wallet },
    { name: 'House Rent & Utility', path: '/rent-utilities', icon: Building2 },
    { name: 'Monthly Reports', path: '/reports', icon: FileSpreadsheet },
    { name: 'Mess Chat', path: '/chat', icon: MessageSquare },
  ];

  const navigationItems = isMember ? memberNavItems : adminNavItems;

  return (
    <aside className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-300 w-64 select-none border-r border-slate-800/80 shadow-2xl">
      {/* Brand Header */}
      <div className="flex items-center gap-3.5 px-6 py-5.5 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 ring-1 ring-white/20">
          <UtensilsCrossed className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-extrabold text-white tracking-wide flex items-center gap-1.5">
            MealManager
          </h1>
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
            <Sparkles className="w-3 h-3" /> {isMember ? 'Member Portal' : 'Admin Console'}
          </p>
        </div>
      </div>

      {/* Month Status Badge in Sidebar */}
      {isClosed && (
        <div className="mx-4 mt-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center gap-2.5 shadow-xs">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="font-bold block truncate">{currentMonthData?.monthName}</span>
            <span className="text-[10px] text-amber-400/80">Month is closed (Read-only)</span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isChat = item.path === '/chat';
          const hasUnread = isChat && unreadCount > 0;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/40 ring-1 ring-white/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {hasUnread && (
                    <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/50">
        <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative">
              <div
                className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 shadow-inner ${
                  isMember ? 'bg-teal-500/20 text-teal-300 ring-1 ring-teal-500/30' : 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
                }`}
              >
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-200 truncate">
                  {user?.displayName || 'User'}
                </p>
                <span
                  className={`text-[8px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                    isMember
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
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
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[9px] text-slate-500 text-center mt-2.5 font-medium">
          © {new Date().getFullYear()} Ayatul Khan Pathan
        </div>
      </div>
    </aside>
  );
};
