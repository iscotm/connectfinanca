import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Lock,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMenuSecurity } from '@/contexts/MenuSecurityContext';
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
import { toast } from 'sonner';

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
  const navigate = useNavigate();
  const { logout, user, company } = useAuth();
  const { isRouteProtected, isUnlocked, unlock } = useMenuSecurity();

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [errorShake, setErrorShake] = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Auto focus first input when modal opens
  useEffect(() => {
    if (pinModalOpen) {
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 100);
    }
  }, [pinModalOpen]);

  const isInactive = !user || (
    user.role !== 'admin' && (
      user.status === 'expirado' ||
      user.status === 'pausado' ||
      user.status === 'bloqueado' ||
      user.access_type === 'Sem plano' ||
      !user.access_type
    )
  );

  const isActive = (path: string) => location.pathname === path;

  const handleMenuClick = (e: React.MouseEvent, url: string, isLocked: boolean) => {
    if (isLocked) {
      e.preventDefault();
      setPendingUrl(url);
      setPinModalOpen(true);
      setPin(['', '', '', '']);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(-1);
    const newPin = [...pin];
    newPin[index] = cleanValue;
    setPin(newPin);

    if (cleanValue && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    const fullPin = newPin.join('');
    if (fullPin.length === 4) {
      const success = unlock(fullPin);
      if (success) {
        toast.success('Acesso liberado com sucesso!');
        setPinModalOpen(false);
        navigate(pendingUrl);
      } else {
        setErrorShake(true);
        toast.error('Senha incorreta.');
        setTimeout(() => {
          setPin(['', '', '', '']);
          setErrorShake(false);
          inputRefs[0].current?.focus();
        }, 500);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  return (
    <>
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
                  const hasPinProtection = isRouteProtected(item.url);
                  const isLocked = hasPinProtection && !isUnlocked;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className={cn(
                          "flex items-center justify-between rounded-2xl transition-all duration-150 h-auto",
                          collapsed ? "p-2.5 justify-center w-full" : "px-4 py-3",
                          active 
                            ? "bg-gradient-to-r from-blue-600/20 to-transparent border-l-2 border-blue-500 text-white font-medium text-xs" 
                            : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200 font-medium text-xs"
                        )}
                      >
                        <NavLink 
                          to={item.url} 
                          onClick={(e) => handleMenuClick(e, item.url, isLocked)}
                          className="w-full flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <item.icon className={cn(
                              "w-5 h-5 flex-shrink-0 transition-colors",
                              collapsed && "mx-auto",
                              active ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"
                            )} />
                            {!collapsed && (
                              <span className="text-xs ml-3">{item.title}</span>
                            )}
                          </div>
                          {!collapsed && (
                            <div className="flex items-center gap-1.5">
                              {hasPinProtection && (
                                <span
                                  title={isLocked ? "Bloqueado por PIN" : "Protegido por PIN (Desbloqueado)"}
                                  className={cn(
                                    "p-1 rounded-md text-[10px] flex items-center justify-center",
                                    isLocked ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-blue-500/10 text-blue-400/80 border border-blue-500/20"
                                  )}
                                >
                                  <Lock size={10} />
                                </span>
                              )}
                              {isInactive && (
                                <span className="text-[10px] text-slate-500 flex items-center gap-1 font-bold">
                                  <i className="fas fa-lock text-[9px] text-amber-400/80"></i>
                                </span>
                              )}
                            </div>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {isInactive && !collapsed && (
            <div className="mx-2 my-4 p-4 rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/20 text-center space-y-2">
              <div className="inline-flex p-1.5 rounded-lg bg-amber-500/20 text-amber-400 mb-1">
                <i className="fas fa-lock text-xs"></i>
              </div>
              <p className="text-[11px] font-black uppercase tracking-wider text-amber-400">Plano Inativo</p>
              <p className="text-[10px] text-slate-400 leading-tight">Assine para desbloquear todas as ferramentas.</p>
              <NavLink
                to="/perfil"
                className="mt-2 inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all"
              >
                <span>Ver Planos</span>
              </NavLink>
            </div>
          )}

          <SidebarGroup className="mt-4">
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

      {/* MODAL DE SENHA PARA MENUS */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`glass-panel w-full max-w-sm rounded-[28px] p-8 shadow-2xl relative flex flex-col items-center text-center bg-slate-900/90 border border-slate-800 ${errorShake ? 'animate-shake border-rose-500/60 ring-2 ring-rose-500/30' : ''}`}>
            
            <button 
              onClick={() => { setPinModalOpen(false); setPin(['','','','']); }}
              className="absolute right-5 top-5 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/20 mb-5 border border-amber-400/30">
              <Lock size={24} />
            </div>

            <h2 className="text-xl font-black text-white tracking-tight mb-2">
              Menu Bloqueado
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Digite seu PIN de 4 dígitos para acessar este conteúdo.
            </p>

            <div className="flex items-center justify-center gap-3 w-full mb-2">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`
                    w-12 h-14 text-center text-xl font-black rounded-2xl outline-none transition-all
                    bg-slate-950/80 border text-white
                    ${digit ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-950/20' : 'border-slate-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20'}
                  `}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
