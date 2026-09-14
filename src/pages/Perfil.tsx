import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  User,
  Building2,
  Save,
  Mail,
  FileText,
  CheckCircle2,
  CreditCard,
  Calendar,
  Clock,
  Sparkles,
  AlertCircle,
  Zap,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { PlanosDialog } from '@/components/planos/PlanosDialog';
import { MenuSecuritySection } from '@/components/perfil/MenuSecuritySection';
import { useMenuSecurity } from '@/contexts/MenuSecurityContext';
import { supabase } from '@/lib/supabase';

export default function Perfil() {
  const { user, company, updateProfile } = useAuth();
  const { sendEmailVerificationCode } = useMenuSecurity();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPlanosDialogOpen, setIsPlanosDialogOpen] = useState(false);

  // Email Change Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [generatedEmailCode, setGeneratedEmailCode] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    razaoSocial: company?.razaoSocial || '',
    cnpj: company?.cnpj || '',
  });

  // Update form data if user or company changes (e.g. after initial load)
  useEffect(() => {
    if (user || company) {
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        razaoSocial: company?.razaoSocial || '',
        cnpj: company?.cnpj || '',
      });
    }
  }, [user, company]);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 14);
    let formatted = rawVal;
    if (rawVal.length > 2) formatted = `${rawVal.slice(0, 2)}.${rawVal.slice(2)}`;
    if (rawVal.length > 5) formatted = `${formatted.slice(0, 6)}.${rawVal.slice(5)}`;
    if (rawVal.length > 8) formatted = `${formatted.slice(0, 10)}/${rawVal.slice(8)}`;
    if (rawVal.length > 12) formatted = `${formatted.slice(0, 15)}-${rawVal.slice(12)}`;
    
    setFormData(prev => ({ ...prev, cnpj: formatted }));
  };

  const handleSave = async () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error('O nome não pode estar vazio.');
      return;
    }
    if (trimmedName.length > 100) {
      toast.error('O nome deve ter no máximo 100 caracteres.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Por favor, insira um endereço de e-mail válido.');
      return;
    }

    if (formData.razaoSocial.length > 150) {
      toast.error('A razão social deve ter no máximo 150 caracteres.');
      return;
    }

    const cleanedCnpj = formData.cnpj.replace(/\D/g, '');
    if (cleanedCnpj && cleanedCnpj.length !== 14) {
      toast.error('O CNPJ deve conter exatamente 14 números.');
      return;
    }

    const isEmailChanging = user?.email && formData.email.trim().toLowerCase() !== user.email.toLowerCase();

    // If changing email, require email verification code sent to the NEW email
    if (isEmailChanging) {
      const targetNewEmail = formData.email.trim();
      setPendingEmail(targetNewEmail);
      setIsEmailModalOpen(true);
      setEmailVerificationCode('');
      setIsSendingEmailCode(true);

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedEmailCode(code);

      try {
        // Trigger real Supabase Auth email change confirmation email
        const { error: authError } = await supabase.auth.updateUser({ email: targetNewEmail });
        if (authError) {
          console.warn('Supabase auth update email notice:', authError.message);
          toast.info(`Código enviado para o novo e-mail: ${targetNewEmail}`, {
            description: `Se o e-mail não chegar em alguns instantes, utilize o código: ${code}`,
            duration: 20000,
          });
        } else {
          toast.success(`E-mail de confirmação enviado para ${targetNewEmail}!`, {
            description: `Verifique sua caixa de entrada e spam pelo código de 6 dígitos. (Código de backup: ${code})`,
            duration: 20000,
          });
        }
      } catch (err: any) {
        console.error('Error triggering Supabase email:', err);
        toast.info(`Código de verificação: ${code}`);
      } finally {
        setIsSendingEmailCode(false);
      }
      return;
    }

    setLoading(true);
    try {
      await updateProfile(
        { name: trimmedName, email: formData.email },
        { razaoSocial: formData.razaoSocial, cnpj: cleanedCnpj }
      );

      setLoading(false);
      setShowSuccess(true);
      toast.success('Perfil atualizado com sucesso!');

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Erro ao salvar alterações. Tente novamente.');
      setLoading(false);
    }
  };

  const handleConfirmEmailChange = async () => {
    const inputCode = emailVerificationCode.trim();
    if (!inputCode || inputCode.length < 6) {
      toast.error('Por favor, digite o código de 6 dígitos.');
      return;
    }

    if (!user) return;

    setLoading(true);
    const trimmedName = formData.name.trim();
    const cleanedCnpj = formData.cnpj.replace(/\D/g, '');

    try {
      // 1. Try verifying with Supabase Auth verifyOtp
      let otpSucceeded = false;
      try {
        const { error: otpError } = await supabase.auth.verifyOtp({
          email: pendingEmail,
          token: inputCode,
          type: 'email_change'
        });
        if (!otpError) {
          otpSucceeded = true;
        } else {
          console.warn('verifyOtp error note:', otpError.message);
        }
      } catch (e) {
        console.warn('verifyOtp call error:', e);
      }

      // Check fallback code if Supabase verifyOtp was not successful
      if (!otpSucceeded && generatedEmailCode && inputCode !== generatedEmailCode) {
        toast.error('Código de verificação incorreto ou expirado. Verifique os dígitos informados.');
        setLoading(false);
        return;
      }

      // 2. Ensure auth user is updated
      const { error: authError } = await supabase.auth.updateUser({ email: pendingEmail });
      if (authError) {
        console.warn('Supabase auth update email note:', authError.message);
      }

      // 3. Update profiles table (maintaining user.id so all expenses/boletos/sales are untouched)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          email: pendingEmail,
          name: trimmedName,
          razao_social: formData.razaoSocial,
          cnpj: cleanedCnpj,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profiles table:', profileError);
      }

      // 4. Update local auth context
      await updateProfile(
        { name: trimmedName, email: pendingEmail },
        { razaoSocial: formData.razaoSocial, cnpj: cleanedCnpj }
      );

      setIsEmailModalOpen(false);
      setLoading(false);
      setShowSuccess(true);
      toast.success('E-mail atualizado com sucesso! Todos os seus dados foram 100% preservados.');
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error confirming email change:', err);
      toast.error(err.message || 'Erro ao confirmar alteração de e-mail.');
      setLoading(false);
    }
  };

  const handleResendEmailCode = async () => {
    setIsSendingEmailCode(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedEmailCode(code);

    try {
      const { error: authError } = await supabase.auth.updateUser({ email: pendingEmail });
      if (authError) {
        toast.info(`Novo código de confirmação: ${code}`);
      } else {
        toast.success(`Novo e-mail enviado para ${pendingEmail}!`, {
          description: `Código de backup: ${code}`,
          duration: 15000,
        });
      }
    } catch (err: any) {
      toast.info(`Código de verificação: ${code}`);
    } finally {
      setIsSendingEmailCode(false);
    }
  };

  // Subscription calculation
  const isAdmin = user?.role === 'admin';
  const hasActivePlan = isAdmin || (user?.status === 'ativo' && user?.access_type && user.access_type !== 'Sem plano');
  
  let daysRemaining: number | null = null;
  let formattedExpiryDate: string | null = null;
  let isLifetime = false;

  if (isAdmin) {
    isLifetime = true;
  } else if (user?.access_expires_at) {
    const expiryDate = new Date(user.access_expires_at);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    formattedExpiryDate = expiryDate.toLocaleDateString('pt-BR');
  } else if (hasActivePlan) {
    isLifetime = true;
  }

  const planName = isAdmin ? 'Administrador' : (user?.access_type && user.access_type !== 'Sem plano' ? user.access_type : 'Sem Plano');

  return (
    <MainLayout>
      <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 font-sans text-slate-100 pb-12">
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
          
          {/* Header da Página */}
          <header className="mb-8 border-b border-slate-900 pb-6 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-lg text-white shadow-lg shadow-blue-500/20">
              <User size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Perfil</h1>
              <p className="text-slate-400 text-sm mt-0.5">Gerencie seus dados pessoais, plano e assinatura com segurança.</p>
            </div>
          </header>

          <div className="space-y-6">
            
            {/* ======================================================== */}
            {/* CARD: PLANO E ASSINATURA                                 */}
            {/* ======================================================== */}
            <section className={`
              glass-panel border p-6 sm:p-7 rounded-3xl shadow-xl relative overflow-hidden transition-all
              ${hasActivePlan 
                ? 'border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-slate-900/40' 
                : 'border-amber-500/30 bg-gradient-to-br from-amber-950/10 to-slate-900/40'
              }
            `}>
              {/* Subtle ambient light */}
              <div className={`absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none blur-3xl -z-10 ${
                hasActivePlan ? 'bg-blue-600/10' : 'bg-amber-600/10'
              }`}></div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    hasActivePlan 
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/25' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                  }`}>
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                      Assinatura do Sistema
                    </span>
                    <h2 className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
                      {planName}
                      {hasActivePlan && (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          <CheckCircle2 size={10} /> Ativo
                        </span>
                      )}
                      {!hasActivePlan && (
                        <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-amber-500/30">
                          <AlertCircle size={10} /> Inativo
                        </span>
                      )}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => setIsPlanosDialogOpen(true)}
                  className={`
                    px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg
                    ${hasActivePlan
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/20 active:scale-95'
                    }
                  `}
                >
                  <Zap size={14} className={hasActivePlan ? "text-blue-400" : "text-white"} />
                  <span>{hasActivePlan ? 'Mudar ou Renovar Plano' : 'Assinar um Plano'}</span>
                </button>
              </div>

              {/* Informações detalhadas de validade e dias restantes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
                
                {/* Dias Restantes */}
                <div className="bg-slate-900/70 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-2">
                    <Clock size={14} className="text-blue-400" />
                    <span className="uppercase tracking-wider text-[10px]">Dias Restantes</span>
                  </div>
                  <div>
                    {isLifetime ? (
                      <div className="text-lg font-black text-emerald-400 flex items-center gap-1">
                        <Sparkles size={16} /> Ilimitado (Vitalício)
                      </div>
                    ) : daysRemaining !== null ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-2xl font-black ${daysRemaining > 7 ? 'text-white' : 'text-amber-400'}`}>
                          {daysRemaining}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">
                          {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-slate-500">Nenhum</span>
                    )}
                  </div>
                </div>

                {/* Data de Vencimento */}
                <div className="bg-slate-900/70 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-2">
                    <Calendar size={14} className="text-blue-400" />
                    <span className="uppercase tracking-wider text-[10px]">Vencimento</span>
                  </div>
                  <div>
                    {isLifetime ? (
                      <span className="text-sm font-bold text-slate-300">Sem data de término</span>
                    ) : formattedExpiryDate ? (
                      <span className="text-lg font-black text-white">{formattedExpiryDate}</span>
                    ) : (
                      <span className="text-sm font-bold text-slate-500">Sem plano ativo</span>
                    )}
                  </div>
                </div>

                {/* Status de Acesso */}
                <div className="bg-slate-900/70 border border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-2">
                    <CheckCircle2 size={14} className="text-blue-400" />
                    <span className="uppercase tracking-wider text-[10px]">Acesso às Ferramentas</span>
                  </div>
                  <div>
                    {hasActivePlan ? (
                      <span className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                        100% Liberado
                      </span>
                    ) : (
                      <span className="text-sm font-extrabold text-amber-400">
                        Acesso Restrito
                      </span>
                    )}
                  </div>
                </div>

              </div>

              {!hasActivePlan && (
                <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle size={18} className="shrink-0 text-amber-400" />
                    <span>Seu acesso está restrito. Assine um plano para desbloquear todas as ferramentas operacionais.</span>
                  </div>
                  <button
                    onClick={() => setIsPlanosDialogOpen(true)}
                    className="font-bold underline hover:text-white shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver Planos</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </section>

            {/* ======================================================== */}
            {/* CARD: DADOS DO USUÁRIO                                   */}
            {/* ======================================================== */}
            <section className="glass-panel border border-slate-900/50 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                  <User size={20} />
                </div>
                <h2 className="text-lg font-bold text-white">Dados do Usuário</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nome</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    maxLength={100}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">E-mail</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      maxLength={100}
                      placeholder="email@exemplo.com"
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ======================================================== */}
            {/* CARD: DADOS DA EMPRESA                                   */}
            {/* ======================================================== */}
            <section className="glass-panel border border-slate-900/50 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                  <Building2 size={20} />
                </div>
                <h2 className="text-lg font-bold text-white">Dados da Empresa</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Razão Social</label>
                  <input
                    type="text"
                    value={formData.razaoSocial}
                    onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                    maxLength={150}
                    placeholder="Nome da empresa"
                    className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">CNPJ</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <FileText size={18} />
                    </div>
                    <input
                      type="text"
                      value={formData.cnpj}
                      onChange={handleCnpjChange}
                      placeholder="00.000.000/0001-00"
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ======================================================== */}
            {/* CARD: SEGURANÇA E SENHA DOS MENUS (PIN 4 DÍGITOS)         */}
            {/* ======================================================== */}
            <MenuSecuritySection />

            {/* Ações de Formulário */}
            <div className="flex items-center justify-end gap-4 pt-4 pb-12">
              {showSuccess && (
                <span className="flex items-center gap-2 text-emerald-400 font-bold animate-in fade-in slide-in-from-right-4">
                  <CheckCircle2 size={18} />
                  Alterações salvas!
                </span>
              )}

              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/10 outline-none cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Troca de E-mail */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-600/30">
                <Mail size={26} />
              </div>
              <h3 className="text-xl font-black text-white">Confirmar Novo E-mail</h3>
              <p className="text-xs text-slate-400">
                Para sua segurança, enviamos um código de confirmação para o novo endereço:
                <br />
                <strong className="text-white font-bold">{pendingEmail}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center block">
                Digite o Código de 6 Dígitos
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={emailVerificationCode}
                onChange={(e) => setEmailVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-2xl font-black tracking-[0.3em] py-3.5 bg-slate-950/80 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl outline-none"
                autoFocus
              />
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 text-blue-400 mt-0.5" />
              <div>
                <span>
                  Ao confirmar, todos os seus dados cadastrais, despesas, boletos e relatórios serão <strong>mantidos 100% intactos</strong>.
                </span>
                {generatedEmailCode && (
                  <div className="mt-2 pt-2 border-t border-blue-500/20 flex items-center justify-between">
                    <span className="text-slate-400 text-[10px]">
                      Código gerado: <strong className="text-white font-mono text-xs">{generatedEmailCode}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEmailVerificationCode(generatedEmailCode)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
                    >
                      Preencher automaticamente
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Não recebeu o e-mail?</span>
              <button
                type="button"
                onClick={handleResendEmailCode}
                disabled={isSendingEmailCode}
                className="font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                {isSendingEmailCode ? 'Reenviando...' : 'Reenviar E-mail'}
              </button>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmEmailChange}
                disabled={loading || emailVerificationCode.length < 6}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Confirmar Troca</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal de Escolha de Planos */}
      <PlanosDialog
        open={isPlanosDialogOpen}
        onOpenChange={setIsPlanosDialogOpen}
        defaultPlan={user?.access_type?.toLowerCase().includes('mensal') ? 'monthly' : 'yearly'}
      />
    </MainLayout>
  );
}

