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
  MessageSquare
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { useChatContext } from '../../context/ChatContext';

export const MobileNavigation = () => {
  const { isMember } = useAuthContext();
  const { unreadCount } = useChatContext();

  const adminNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Meals', path: '/meals', icon: UtensilsCrossed },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Market', path: '/market-costs', icon: ShoppingCart },
    { name: 'Deposits', path: '/deposits', icon: Wallet },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
  ];

  const memberNavItems = [
    { name: 'My Portal', path: '/portal', icon: UserCheck },
    { name: 'Meals', path: '/meals', icon: UtensilsCrossed },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Market', path: '/market-costs', icon: ShoppingCart },
    { name: 'Deposits', path: '/deposits', icon: Wallet },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
  ];

  const mobileNavItems = isMember ? memberNavItems : adminNavItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-1 shadow-lg no-print">
      <div className="flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isChat = item.path === '/chat';
          const hasUnread = isChat && unreadCount > 0;

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
              <div className="relative">
                <Icon className="w-5 h-5 mb-0.5" />
                {hasUnread && (
                  <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[9px] font-extrabold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center shadow-md animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
