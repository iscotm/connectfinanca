import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CAKTO_PLANS, getCaktoCheckoutUrl } from '@/config/cakto';
import { toast } from 'sonner';
import {
  X,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap
} from 'lucide-react';

interface PlanosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPlan?: string;
}

export function PlanosDialog({ open, onOpenChange, defaultPlan = 'yearly' }: PlanosDialogProps) {
  const { user, company, refreshProfile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>(defaultPlan);
  const [isChecking, setIsChecking] = useState(false);

  if (!open) return null;

  const activePlanConfig = CAKTO_PLANS[selectedPlan] || CAKTO_PLANS['yearly'];

  const handleGoToCheckout = () => {
    if (!user) return;

    const checkoutUrl = getCaktoCheckoutUrl(selectedPlan, {
      email: user.email,
      name: user.name,
      phone: user.phone || undefined,
      doc: company?.cnpj || undefined,
    });

    localStorage.setItem('selectedPlan', selectedPlan);
    window.location.href = checkoutUrl;
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    toast.loading("Verificando status do pagamento...", { id: "check-plan-dialog" });

    try {
      await refreshProfile();
      setTimeout(() => {
        setIsChecking(false);
        if (user && user.status === 'ativo' && user.access_type !== 'Sem plano') {
          toast.success("Pagamento confirmado! Acesso liberado.", { id: "check-plan-dialog" });
          onOpenChange(false);
        } else {
          toast.info("Ainda aguardando confirmação da Cakto. Assim que o pagamento for aprovado, seu acesso será liberado automaticamente.", { id: "check-plan-dialog", duration: 5000 });
        }
      }, 1500);
    } catch {
      setIsChecking(false);
      toast.error("Erro ao verificar status. Tente novamente.", { id: "check-plan-dialog" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 font-sans text-slate-100 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-4xl bg-[#0B1120] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <header className="px-6 py-5 sm:px-8 sm:py-6 flex justify-between items-center border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Planos & Assinatura
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Escolha o plano ideal para gerenciar o financeiro do seu negócio
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </header>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          
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
                    relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between
                    ${isSelected
                      ? 'border-blue-500 bg-blue-600/10 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/40'
                      : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
                    }
                  `}
                >
                  {isYearly && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                      <Sparkles size={10} /> Mais Popular
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        {plan.name}
                      </span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-700'
                      }`}>
                        {isSelected && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                    </div>

                    <div className="my-3">
                      <div className="text-xl sm:text-2xl font-black text-white">{plan.price}</div>
                      <div className="text-[10px] font-bold text-slate-500 mt-0.5">/{plan.period}</div>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800/60">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-blue-400 shrink-0" />
                        <span>Controle de Caixa Diário</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-blue-400 shrink-0" />
                        <span>Separações e DRE</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-blue-400 shrink-0" />
                        <span>Fundo de Caixa e CMV</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4 pt-3">
                    <button
                      type="button"
                      className={`w-full py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all ${
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

          {/* Banner de Ação */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plano Selecionado</span>
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  {activePlanConfig.name} — <span className="text-blue-400">{activePlanConfig.price}</span>
                </h4>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <ShieldCheck size={14} />
                <span>Checkout 100% Seguro Cakto</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleGoToCheckout}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer"
              >
                <span>Pagar Plano na Cakto ({activePlanConfig.price})</span>
                <ExternalLink size={16} />
              </button>

              <button
                onClick={handleCheckStatus}
                disabled={isChecking}
                className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={14} className={isChecking ? "animate-spin text-blue-400" : ""} />
                <span>Verificar Liberação</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
