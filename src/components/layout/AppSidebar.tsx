import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import {
  LayoutDashboard,
  Building2,
  FileText,
  ShoppingCart,
  Scale,
  LogOut,
  TrendingUp,
  PackageCheck,
  User,
  PiggyBank,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Despesas Fixas CNPJ', url: '/despesas-cnpj', icon: Building2 },
  { title: 'Boletos', url: '/boletos', icon: FileText },
  { title: 'Controle de Compras', url: '/compras', icon: ShoppingCart },
  { title: 'Cotação de Produtos', url: '/cotacao', icon: Scale },
  { title: 'Separações', url: '/separacoes', icon: PackageCheck },
  { title: 'Fundo de Caixa', url: '/fundo-caixa', icon: PiggyBank },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { logout, user, company } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-slate-900/60 bg-slate-950/40 backdrop-blur-xl">
      <SidebarHeader className={cn("p-6", collapsed && "p-3 flex justify-center")}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-extrabold text-white tracking-tight leading-none">
                Connect
              </span>
              <span className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mt-1">Finanças</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className={cn("px-4 py-2 mt-4 sidebar-scrollbar overflow-y-auto no-scrollbar", collapsed && "px-2")}>
        <SidebarGroup>
          <SidebarGroupLabel className={cn("px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 h-auto", collapsed && "mb-0")}>
            {!collapsed && 'Menu Principal'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {menuItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl transition-all duration-150 h-auto",
                        collapsed ? "p-2.5 justify-center w-full" : "px-4 py-3",
                        active 
                          ? "bg-gradient-to-r from-blue-600/20 to-transparent border-l-2 border-blue-500 text-white font-medium text-xs" 
                          : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200 font-medium text-xs"
                      )}
                    >
                      <NavLink to={item.url} className="w-full flex items-center justify-start">
                        <item.icon className={cn(
                          "w-5 h-5 flex-shrink-0 transition-colors",
                          collapsed && "mx-auto",
                          active ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"
                        )} />
                        {!collapsed && (
                          <span className="text-xs ml-3">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className={cn("px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 h-auto", collapsed && "mb-0")}>
            {!collapsed && 'Conta'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/perfil')}
                  tooltip="Perfil"
                  className={cn(
                    "flex items-center gap-3 rounded-2xl transition-all duration-150 h-auto",
                    collapsed ? "p-2.5 justify-center w-full" : "px-4 py-3",
                    isActive('/perfil')
                      ? "bg-gradient-to-r from-blue-600/20 to-transparent border-l-2 border-blue-500 text-white font-medium text-xs" 
                      : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200 font-medium text-xs"
                  )}
                >
                  <NavLink to="/perfil" className="w-full flex items-center justify-start">
                    <User className={cn(
                      "w-5 h-5 flex-shrink-0 transition-colors",
                      collapsed && "mx-auto",
                      isActive('/perfil') ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"
                    )} />
                    {!collapsed && <span className="text-xs ml-3">Perfil</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={logout}
                  tooltip="Sair"
                  className={cn(
                    "flex items-center gap-3 rounded-2xl transition-all duration-150 text-rose-400 hover:bg-rose-950/20 h-auto",
                    collapsed ? "p-2.5 justify-center w-full" : "px-4 py-3"
                  )}
                >
                  <LogOut className={cn("w-5 h-5 flex-shrink-0 text-rose-400", collapsed && "mx-auto")} />
                  {!collapsed && <span className="text-xs font-medium ml-3">Sair</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-900/60">
        {!collapsed && (
          <div className="flex items-center justify-between p-3 bg-slate-900/30 border border-slate-800/40 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                {company?.razaoSocial?.charAt(0).toUpperCase() || 'E'}
              </div>
              <div className="flex flex-col min-w-0">
                <h4 className="text-xs font-bold text-white truncate">
                  {company?.razaoSocial || 'Empresa'}
                </h4>
                <p className="text-[9px] text-slate-400 truncate">
                  {user?.name || 'make10mv'}
                </p>
              </div>
            </div>
            <button className="text-slate-400 hover:text-white p-1 text-xs">
              <i className="fas fa-chevron-up"></i>
            </button>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
              {company?.razaoSocial?.charAt(0).toUpperCase() || 'E'}
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
