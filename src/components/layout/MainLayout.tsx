import { ReactNode, useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, company, logout, updateProfile } = useAuth();
  
  // Intercept if subscription is not active
  const isInactive = !user || user.status === 'expirado' || user.access_type === 'Sem plano';

  const [selectedPlan, setSelectedPlan] = useState<string>(
    localStorage.getItem('selectedPlan') || 'yearly'
  );
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<'idle' | 'preparing' | 'generating'>('idle');

  // Input states for missing data
  const [docInput, setDocInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');

  useEffect(() => {
    if (company?.cnpj) setDocInput(company.cnpj);
    if (user?.phone) setPhoneInput(user.phone);
  }, [company?.cnpj, user?.phone]);

  useEffect(() => {
    // If the user selected a plan on the landing page, we can auto-generate the Pix once they login
    const autoPlan = localStorage.getItem('selectedPlan');
    if (autoPlan && isInactive && user) {
      setSelectedPlan(autoPlan);
      localStorage.removeItem('selectedPlan'); // Clear it
    }
  }, [user, isInactive]);

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 14);
    let masked = raw;
    if (raw.length <= 11) {
      if (raw.length > 3) masked = raw.slice(0, 3) + '.' + raw.slice(3);
      if (raw.length > 6) masked = masked.slice(0, 7) + '.' + masked.slice(7);
      if (raw.length > 9) masked = masked.slice(0, 11) + '-' + masked.slice(11);
    } else {
      masked = raw.slice(0, 2) + '.' + raw.slice(2);
      if (raw.length > 5) masked = masked.slice(0, 6) + '.' + masked.slice(6);
      if (raw.length > 8) masked = masked.slice(0, 10) + '/' + masked.slice(10);
      if (raw.length > 12) masked = masked.slice(0, 15) + '-' + masked.slice(15, 17);
    }
    setDocInput(masked);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 11) raw = raw.slice(0, 11);
    let masked = '';
    if (raw.length > 0) {
      masked = '(' + raw.slice(0, 2);
      if (raw.length > 2) {
        masked += ') ' + raw.slice(2, 7);
        if (raw.length > 7) {
          masked += '-' + raw.slice(7);
        }
      }
    }
    setPhoneInput(masked);
  };

  const handleGeneratePix = async () => {
    if (!user) return;

    const cleanDoc = docInput.replace(/\D/g, '');
    const cleanPhone = phoneInput.replace(/\D/g, '');

    if (!cleanDoc || (cleanDoc.length !== 11 && cleanDoc.length !== 14)) {
      toast.error("Por favor, informe um CPF ou CNPJ válido.");
      return;
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error("Por favor, informe um telefone válido com DDD.");
      return;
    }

    setPaymentState('preparing');
    try {
      // Atualizar o perfil com o documento e telefone se estiverem faltando ou diferentes
      if (cleanDoc !== (company?.cnpj || '').replace(/\D/g, '') || cleanPhone !== (user?.phone || '').replace(/\D/g, '')) {
         await supabase.from('profiles').update({ cnpj: cleanDoc, phone: cleanPhone }).eq('id', user.id);
         updateProfile({ phone: cleanPhone }, { cnpj: cleanDoc });
      }

      // Buscar os dados mais recentes para garantir
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Não foi possível carregar seu perfil. Tente novamente.");
      }

      setPaymentState('generating');
      const { data, error } = await supabase.functions.invoke('create-asaas-pix', {
        body: {
          planCode: selectedPlan,
          email: profile.email || user.email,
          name: profile.name || user.name,
          phone: cleanPhone,
          docNumber: cleanDoc,
          docType: cleanDoc.length === 11 ? 'cpf' : 'cnpj'
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao gerar Pix');
      }

      if (data && data.pixCode) {
        setPixCode(data.pixCode);
        
        let formattedQr = data.qrCodeBase64;
        if (formattedQr && !formattedQr.startsWith('data:image/')) {
          formattedQr = `data:image/png;base64,${formattedQr}`;
        }
        setQrCodeUrl(formattedQr);
        
        toast.success("Código Copia e Cola Pix gerado!");
      } else {
        throw new Error("Não foi possível carregar os dados de pagamento do Asaas.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Não foi possível gerar o Pix neste momento. Tente novamente.");
    } finally {
      setPaymentState('idle');
    }
  };

  const handleCopyPix = () => {
    if (pixCode) {
      navigator.clipboard.writeText(pixCode);
      toast.success("Código Pix copiado para a área de transferência!");
    }
  };

  const handleCheckPayment = async () => {
    toast.loading("Verificando seu pagamento...");
    // Force reload window to trigger fetchProfile in AuthContext
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const needsBillingInfo = !company?.cnpj || !user?.phone;

  if (isInactive && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-slate-100 p-4 font-sans relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(59,130,246,0.12)_0%,rgba(2,6,23,0)_70%)] pointer-events-none z-0"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,rgba(2,6,23,0)_70%)] pointer-events-none z-0"></div>

        <div className="glass-panel w-full max-w-2xl rounded-3xl border border-slate-800 p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20 mb-2">
              <i className="fas fa-lock text-xl text-white"></i>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Ative sua Assinatura</h2>
            <p className="text-slate-400 text-sm">
              Sua conta está ativa, mas você precisa assinar um plano para liberar o acesso total ao sistema.
            </p>
          </div>

          {!pixCode ? (
            <div className="space-y-6">
              {/* Seleção de plano */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { code: 'monthly', title: 'Plano Mensal', price: 'R$ 10,00', period: 'mês' },
                  { code: 'quarterly', title: 'Plano Trimestral', price: 'R$ 247,00', period: 'trimestre' },
                  { code: 'yearly', title: 'Plano Anual', price: 'R$ 797,00', period: 'ano', popular: true },
                  { code: 'lifetime', title: 'Plano Vitalício', price: 'R$ 4.997,00', period: 'único' }
                ].map((plan) => (
                  <div
                    key={plan.code}
                    onClick={() => setSelectedPlan(plan.code)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                      selectedPlan === plan.code
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute top-0 right-4 transform -translate-y-1/2 bg-blue-600 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Melhor Escolha
                      </span>
                    )}
                    <span className="text-xs font-bold text-white block">{plan.title}</span>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-lg font-black text-white">{plan.price}</span>
                      <span className="text-[10px] text-slate-500 font-medium">/{plan.period}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Informações de faturamento se estiverem faltando */}
              {needsBillingInfo && (
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <i className="fas fa-file-invoice text-blue-400"></i>
                      Dados para Faturamento
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Preencha os dados abaixo para gerarmos a cobrança.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        CPF / CNPJ
                      </label>
                      <input
                        type="text"
                        value={docInput}
                        onChange={handleDocChange}
                        placeholder="000.000.000-00"
                        className="w-full bg-[#020617] text-slate-200 placeholder-slate-600 font-medium px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 border border-slate-800 text-sm transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        Telefone
                      </label>
                      <input
                        type="text"
                        value={phoneInput}
                        onChange={handlePhoneChange}
                        placeholder="(11) 99999-9999"
                        className="w-full bg-[#020617] text-slate-200 placeholder-slate-600 font-medium px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 border border-slate-800 text-sm transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Botão de Geração de Pix */}
              <button
                onClick={handleGeneratePix}
                disabled={paymentState !== 'idle'}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-4 rounded-full shadow-lg shadow-blue-600/25 active:scale-95 transition-all text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {paymentState === 'preparing' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                    <span>GERANDO PIX...</span>
                  </>
                ) : paymentState === 'generating' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                    <span>GERANDO PIX...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-qrcode"></i>
                    <span>GERAR PIX PARA PAGAMENTO</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6 flex flex-col items-center">
              {/* QR Code */}
              <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-200">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code Pix" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400">
                    Carregando QR Code...
                  </div>
                )}
              </div>

              <div className="w-full text-center space-y-2">
                <span className="text-xs font-bold text-slate-400 block uppercase">Código Copia e Cola</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pixCode}
                    className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 px-4 py-3 rounded-full text-xs font-mono select-all outline-none"
                  />
                  <button
                    onClick={handleCopyPix}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-3 px-4 rounded-full transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="far fa-copy"></i>
                    <span>Copiar</span>
                  </button>
                </div>
              </div>

              <div className="w-full flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => setPixCode(null)}
                  className="flex-1 border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white font-bold py-3.5 rounded-full transition-all text-xs tracking-wider uppercase cursor-pointer"
                >
                  Alterar Plano
                </button>
                <button
                  onClick={handleCheckPayment}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold py-3.5 rounded-full transition-all text-xs tracking-wider uppercase shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </div>
          )}

          {/* Sair da conta */}
          <div className="text-center pt-2">
            <button
              onClick={logout}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              Sair da Conta (Conectar em outra conta)
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          </header>
          <div className="flex-1 overflow-auto p-6 no-scrollbar">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
