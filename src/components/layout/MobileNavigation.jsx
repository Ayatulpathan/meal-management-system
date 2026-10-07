import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UtensilsCrossed, 
  ShoppingCart, 
  Wallet,
  FileSpreadsheet,
  UserCheck,
  MessageSquare,
  Building2
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useChatContext } from '../../context/ChatContext';

export const MobileNavigation = () => {
  const { isMember } = useAuthContext();
  const { unreadCount } = useChatContext();

  const adminNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Meals', path: '/meals', icon: UtensilsCrossed },
    { name: 'Rent', path: '/rent-utilities', icon: Building2 },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Market', path: '/market-costs', icon: ShoppingCart },
    { name: 'Deposits', path: '/deposits', icon: Wallet },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
  ];

  const memberNavItems = [
    { name: 'Portal', path: '/portal', icon: UserCheck },
    { name: 'Meals', path: '/meals', icon: UtensilsCrossed },
    { name: 'Rent', path: '/rent-utilities', icon: Building2 },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Market', path: '/market-costs', icon: ShoppingCart },
    { name: 'Deposits', path: '/deposits', icon: Wallet },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
  ];

  const mobileNavItems = isMember ? memberNavItems : adminNavItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-slate-200/90 px-2 py-1.5 shadow-2xl no-print">
      <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-1">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isChat = item.path === '/chat';
          const hasUnread = isChat && unreadCount > 0;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all shrink-0 ${
                  isActive
                    ? 'text-emerald-700 bg-emerald-50/80 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-4.5 h-4.5 mb-0.5" />
                {hasUnread && (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[8px] font-black min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="truncate max-w-[48px]">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
