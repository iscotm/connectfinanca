import { ReactNode, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { CAKTO_PLANS, getCaktoCheckoutUrl } from '@/config/cakto';
import { toast } from 'sonner';
import {
  Lock,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Zap,
  Sparkles,
  User as UserIcon
} from 'lucide-react';

import { MenuPinGate } from '@/components/security/MenuPinGate';
import { useMenuSecurity } from '@/contexts/MenuSecurityContext';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, company, logout, refreshProfile } = useAuth();
  const { settings, isUnlocked, lock } = useMenuSecurity();
  const location = useLocation();
  const navigate = useNavigate();

  // Intercept if subscription is not active (admins always bypass)
  const isInactive = !user || (
    user.role !== 'admin' && (
      user.status === 'expirado' ||
      user.status === 'pausado' ||
      user.status === 'bloqueado' ||
      user.access_type === 'Sem plano' ||
      !user.access_type
    )
  );

  const isProfilePage = location.pathname === '/perfil';

  const [selectedPlan, setSelectedPlan] = useState<string>(() => {
    return localStorage.getItem('selectedPlan') || 'yearly';
  });
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  useEffect(() => {
    const savedPlan = localStorage.getItem('selectedPlan');
    if (savedPlan && CAKTO_PLANS[savedPlan]) {
      setSelectedPlan(savedPlan);
    }
  }, []);

  const handleGoToCheckout = () => {
    if (!user) return;

    const checkoutUrl = getCaktoCheckoutUrl(selectedPlan, {
      email: user.email,
      name: user.name,
      phone: user.phone || undefined,
      doc: company?.cnpj || undefined,
    });

    // Save selected plan
    localStorage.setItem('selectedPlan', selectedPlan);
    
    // Redirect to Cakto checkout
    window.location.href = checkoutUrl;
  };

  const handleCheckStatus = async () => {
    setIsCheckingPayment(true);
    toast.loading("Verificando status do pagamento...", { id: "check-payment" });

    try {
      await refreshProfile();
      setTimeout(() => {
        setIsCheckingPayment(false);
        if (user && user.status === 'ativo' && user.access_type !== 'Sem plano') {
          toast.success("Pagamento confirmado! Acesso liberado.", { id: "check-payment" });
        } else {
          toast.info("Ainda aguardando confirmação da Cakto. Assim que o pagamento for aprovado, seu acesso será liberado automaticamente.", { id: "check-payment", duration: 5000 });
        }
      }, 1500);
    } catch {
      setIsCheckingPayment(false);
      toast.error("Erro ao verificar status. Tente novamente em instantes.", { id: "check-payment" });
    }
  };

  // =========================================================================
  // TELA DE ESCOLHA DE PLANO E PAGAMENTO CAKTO (QUANDO TENTAR ACESSAR OUTRAS ROTAS)
  // =========================================================================
  if (isInactive && user && !isProfilePage) {
    const activePlanConfig = CAKTO_PLANS[selectedPlan] || CAKTO_PLANS['yearly'];

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-slate-100 p-4 sm:p-6 font-sans relative overflow-x-hidden">
        {/* Glow ambient effects */}
        <div className="absolute top-[-10%] left-[15%] w-[650px] h-[650px] bg-[radial-gradient(circle,rgba(59,130,246,0.15)_0%,rgba(2,6,23,0)_70%)] pointer-events-none z-0"></div>
        <div className="absolute bottom-[5%] right-[10%] w-[750px] h-[750px] bg-[radial-gradient(circle,rgba(6,182,212,0.12)_0%,rgba(2,6,23,0)_70%)] pointer-events-none z-0"></div>

        <div className="w-full max-w-4xl relative z-10 space-y-8 my-8">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-600/25 mb-1 border border-blue-400/20 animate-pulse">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Acesso Restrito: Escolha seu Plano
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Para acessar este módulo e utilizar as ferramentas completas de gestão financeira, selecione um plano abaixo para ativar seu acesso:
            </p>
          </div>

          {/* Grid de Planos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(CAKTO_PLANS).map((plan) => {
              const isSelected = selectedPlan === plan.code;
              const isYearly = plan.code === 'yearly';

              return (
                <div
                  key={plan.code}
                  onClick={() => setSelectedPlan(plan.code)}
                  className={`
                    relative p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between
                    ${isSelected
                      ? 'border-blue-500 bg-blue-600/10 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/40'
                      : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
                    }
                  `}
                >
                  {isYearly && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                      <Sparkles size={10} /> Mais Popular
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        {plan.name}
                      </span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-700'
                      }`}>
                        {isSelected && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                    </div>

                    <div className="my-4">
                      <div className="text-2xl sm:text-3xl font-black text-white">{plan.price}</div>
                      <div className="text-[11px] font-bold text-slate-500 mt-0.5">/{plan.period}</div>
                    </div>

                    <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800/60">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-blue-400 shrink-0" />
                        <span>Controle de Caixa Diário</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-blue-400 shrink-0" />
                        <span>Separações e DRE Automático</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-blue-400 shrink-0" />
                        <span>Fundo de Caixa e CMV</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-6 pt-4">
                    <button
                      type="button"
                      className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Selecionado' : 'Selecionar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Painel de Ação de Checkout */}
          <div className="glass-panel bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="text-center sm:text-left space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Plano Selecionado</span>
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2 justify-center sm:justify-start">
                  {activePlanConfig.name} — <span className="text-blue-400">{activePlanConfig.price}</span>
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                <ShieldCheck size={16} />
                <span>Checkout 100% Seguro via Cakto</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleGoToCheckout}
                className="w-full sm:flex-1 py-4 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-600/25 active:scale-95 cursor-pointer"
              >
                <span>Pagar Plano na Cakto ({activePlanConfig.price})</span>
                <ExternalLink size={18} />
              </button>

              <button
                onClick={handleCheckStatus}
                disabled={isCheckingPayment}
                className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={16} className={isCheckingPayment ? "animate-spin text-blue-400" : ""} />
                <span>Já Paguei / Verificar</span>
              </button>
            </div>

            <p className="text-[11px] text-center text-slate-500">
              Após concluir o pagamento na página da Cakto, seu acesso é liberado instantaneamente pelo sistema.
            </p>
          </div>

          {/* Links Auxiliares */}
          <div className="flex items-center justify-center gap-6 pt-2">
            <button
              onClick={() => navigate('/perfil')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <UserIcon size={14} />
              <span>Ver Meu Perfil</span>
            </button>

            <span className="text-slate-700">•</span>

            <button
              onClick={logout}
              className="text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sair da Conta</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // LAYOUT PRINCIPAL DO SISTEMA
  // ==========================================
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#020617] text-slate-100 relative overflow-x-hidden font-sans">
        {/* Ambient glow effects */}
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-glow-radial-blue pointer-events-none z-0"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[700px] h-[700px] bg-glow-radial-cyan pointer-events-none z-0"></div>
        <div className="absolute top-[40%] right-[30%] w-[500px] h-[500px] bg-glow-radial-blue pointer-events-none z-0"></div>

        <AppSidebar />
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative z-10 bg-transparent">
          <header className="h-14 border-b border-slate-900 bg-slate-950/40 backdrop-blur-xl flex items-center px-4 sticky top-0 z-20">
            <SidebarTrigger className="mr-4 text-slate-400 hover:text-white" />
            <div className="flex-1" />
            {settings.isEnabled && settings.pin && isUnlocked && (
              <button
                type="button"
                onClick={() => {
                  lock();
                  toast.info('Sessão dos menus bloqueada com sucesso.');
                }}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer mr-2"
                title="Bloquear menus agora"
              >
                <Lock size={13} className="text-amber-400" />
                <span className="hidden sm:inline">Bloquear Menus</span>
              </button>
            )}
          </header>
          <div className="flex-1 overflow-auto p-6 no-scrollbar">
            <MenuPinGate>
              {children}
            </MenuPinGate>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
