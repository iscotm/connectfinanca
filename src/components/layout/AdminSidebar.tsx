import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Activity,
  LogOut,
  ChevronLeft,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const { logout, user } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: 'Visão Geral', path: '/admin' },
    { icon: Users, label: 'Clientes', path: '/admin/users' },
    { icon: CreditCard, label: 'Planos', path: '/admin/plans' },
    { icon: Activity, label: 'Logs do Sistema', path: '/admin/logs' },
  ];

  return (
    <aside className={cn(
      "w-64 bg-slate-950 border-r border-slate-800/60 flex flex-col h-screen fixed left-0 top-0 text-slate-300 z-50 transition-transform duration-300",
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      <div className="p-6 border-b border-slate-800/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400">
            <i className="fas fa-crown text-sm"></i>
          </div>
          <div>
            <h2 className="font-semibold text-slate-100 tracking-tight">Admin SaaS</h2>
            <p className="text-xs text-slate-500">Connect Finanças</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'hover:bg-slate-900 hover:text-slate-200 border border-transparent'
              }`
            }
          >
            <item.icon size={18} />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800/60 space-y-4">
        <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400 mb-1">Logado como</p>
          <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
        </div>
        
        <NavLink 
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-all border border-transparent"
        >
          <ChevronLeft size={18} />
          <span className="font-medium text-sm">Voltar ao App</span>
        </NavLink>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all border border-transparent"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
}
