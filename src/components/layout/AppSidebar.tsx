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
  Settings2,
  User,
  ChevronsUpDown,
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
  { title: 'Configurações DRE', url: '/configuracoes-dre', icon: Settings2 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { logout, user, company } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-800 bg-[#0a0f1d]">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-900/20">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white leading-tight">
                Connect
              </span>
              <span className="text-blue-500 text-xs font-medium uppercase tracking-wider">Finanças</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-2 mt-4 sidebar-scrollbar overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-[2px] text-slate-500 mb-4 h-auto">
            {!collapsed && 'Menu Principal'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className={cn(
                      "flex items-center gap-3 px-4 py-6 rounded-lg transition-all group hover:bg-slate-800/50 hover:text-white h-auto",
                      isActive(item.url) && "nav-active-gradient"
                    )}
                  >
                    <NavLink to={item.url}>
                      <item.icon className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors",
                        isActive(item.url) ? "text-blue-400" : "group-hover:text-blue-400"
                      )} />
                      {!collapsed && (
                        <span className="text-sm font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-[2px] text-slate-500 mb-4 h-auto">
            {!collapsed && 'Conta'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/perfil')}
                  tooltip="Perfil"
                  className={cn(
                    "flex items-center gap-3 px-4 py-6 rounded-lg transition-all group hover:bg-slate-800/50 hover:text-white h-auto",
                    isActive('/perfil') && "nav-active-gradient"
                  )}
                >
                  <NavLink to="/perfil">
                    <User className={cn(
                      "w-5 h-5 flex-shrink-0 transition-colors",
                      isActive('/perfil') ? "text-blue-400" : "group-hover:text-blue-400"
                    )} />
                    {!collapsed && <span className="text-sm font-medium">Perfil</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={logout}
                  tooltip="Sair"
                  className="flex items-center gap-3 px-4 py-6 rounded-lg transition-all group hover:bg-red-500/10 text-red-400 h-auto"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">Sair</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-800">
        {!collapsed && (
          <div className="bg-slate-800/30 p-3 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white font-bold text-sm border border-slate-700">
              {company?.razaoSocial?.charAt(0).toUpperCase() || 'E'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {company?.razaoSocial || 'Empresa'}
              </p>
              <p className="text-slate-500 text-xs truncate">
                {user?.name || 'Usuário'}
              </p>
            </div>
            <button className="p-1 hover:bg-slate-700 rounded-md transition-colors">
              <ChevronsUpDown className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-white font-bold text-xs border border-slate-700">
              {company?.razaoSocial?.charAt(0).toUpperCase() || 'E'}
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
