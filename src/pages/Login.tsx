import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { checkRateLimit } from '@/lib/rateLimit';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Panels: 'login' | 'register' | 'forgot' | 'verify' | 'verify-forgot'
  const [activePanel, setActivePanel] = useState<'login' | 'register' | 'forgot' | 'verify' | 'verify-forgot'>(
    location.pathname === '/cadastro' ? 'register' : 'login'
  );

  useEffect(() => {
    if (location.pathname === '/cadastro') {
      setActivePanel('register');
    } else if (location.pathname === '/login') {
      setActivePanel('login');
    }
  }, [location.pathname]);

  const handleSwitchPanel = (panel: 'login' | 'register' | 'forgot' | 'verify' | 'verify-forgot') => {
    setActivePanel(panel);
    if (panel === 'register') {
      navigate('/cadastro');
    } else if (panel === 'login') {
      navigate('/login');
    }
  };
  
  const [isLoading, setIsLoading] = useState(false);

  // Email address sent for verification (used on verify panel)
  const [verifyEmail, setVerifyEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleResendEmail = async (type: 'signup' | 'signup_forgot') => {
    if (resendTimer > 0) return;
    
    setIsLoading(true);
    try {
      if (type === 'signup') {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: verifyEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/login`
          }
        });
        if (error) throw error;
      } else {
         const { error } = await supabase.auth.resetPasswordForEmail(verifyEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
      }
      
      toast.success('E-mail reenviado com sucesso!');
      setResendTimer(60); // 60 seconds cooldown
    } catch (err: any) {
      toast.error(err.message || 'Erro ao reenviar e-mail. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  // Form states - Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form states - Register
  const [regDoc, setRegDoc] = useState('');
  const [regDocType, setRegDocType] = useState<'cpf' | 'cnpj' | null>(null);
  const [regDocLookupStatus, setRegDocLookupStatus] = useState<'idle' | 'loading' | 'found' | 'error'>('idle');
  const [regName, setRegName] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Form states - Forgot
  const [forgotEmail, setForgotEmail] = useState('');

  // Password validation checks
  const hasMinLength = regPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(regPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_]/.test(regPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasSpecial;

  // ─── CPF mathematical validation ─────────────────────────────────────────
  const isValidCPF = (cpf: string): boolean => {
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
    let rem = (sum * 10) % 11;
    if (rem === 10 || rem === 11) rem = 0;
    if (rem !== parseInt(cpf[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
    rem = (sum * 10) % 11;
    if (rem === 10 || rem === 11) rem = 0;
    return rem === parseInt(cpf[10]);
  };

  // ─── CNPJ mathematical validation ────────────────────────────────────────
  const isValidCNPJ = (cnpj: string): boolean => {
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    const calcDigit = (base: string, weights: number[]): number => {
      const s = base.split('').reduce((acc: number, d: string, i: number) => acc + parseInt(d) * weights[i], 0);
      const r = s % 11;
      return r < 2 ? 0 : 11 - r;
    };
    const d1 = calcDigit(cnpj.slice(0, 12), [5,4,3,2,9,8,7,6,5,4,3,2]);
    if (d1 !== parseInt(cnpj[12])) return false;
    const d2 = calcDigit(cnpj.slice(0, 13), [6,5,4,3,2,9,8,7,6,5,4,3,2]);
    return d2 === parseInt(cnpj[13]);
  };

  // ─── Format CPF/CNPJ mask on input ───────────────────────────────────────
  const handleDocChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 14);

    // Apply mask
    let masked = raw;
    if (raw.length <= 11) {
      // CPF mask: 000.000.000-00
      if (raw.length > 3) masked = raw.slice(0, 3) + '.' + raw.slice(3);
      if (raw.length > 6) masked = masked.slice(0, 7) + '.' + masked.slice(7);
      if (raw.length > 9) masked = masked.slice(0, 11) + '-' + masked.slice(11);
    } else {
      // CNPJ mask: 00.000.000/0000-00
      masked = raw.slice(0, 2) + '.' + raw.slice(2);
      if (raw.length > 5) masked = masked.slice(0, 6) + '.' + masked.slice(6);
      if (raw.length > 8) masked = masked.slice(0, 10) + '/' + masked.slice(10);
      if (raw.length > 12) masked = masked.slice(0, 15) + '-' + masked.slice(15, 17);
    }

    setRegDoc(masked);

    // Determine type and trigger lookup
    if (raw.length === 11) {
      setRegDocType('cpf');
      if (isValidCPF(raw)) {
        setRegDocLookupStatus('found');
        // CPF: no public API – just validate digits
        toast.success('CPF válido. Preencha seu nome completo abaixo.');
      } else {
        setRegDocLookupStatus('error');
        setRegName('');
        setRegCompany('');
        toast.error('CPF inválido. Verifique os dígitos informados.');
      }
    } else if (raw.length === 14) {
      setRegDocType('cnpj');
      if (!isValidCNPJ(raw)) {
        setRegDocLookupStatus('error');
        setRegName('');
        setRegCompany('');
        toast.error('CNPJ inválido. Verifique os dígitos informados.');
        return;
      }
      // CNPJ: fetch from BrasilAPI
      setRegDocLookupStatus('loading');
      setRegName('');
      setRegCompany('');
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${raw}`);
        if (!res.ok) throw new Error('CNPJ não encontrado na Receita Federal.');
        const data = await res.json();
        const razaoSocial = data.razao_social || '';
        const nomeFantasia = data.nome_fantasia || razaoSocial;
        setRegCompany(razaoSocial);
        setRegName(nomeFantasia);
        setRegDocLookupStatus('found');
        toast.success(`CNPJ encontrado: ${razaoSocial}`);
      } catch {
        setRegDocLookupStatus('error');
        toast.error('CNPJ não localizado na Receita Federal. Verifique e tente novamente.');
      }
    } else {
      setRegDocType(null);
      setRegDocLookupStatus('idle');
    }
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
    setRegPhone(masked);
  };

  // Submit - Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos obrigatórios para prosseguir.");
      return;
    }

    const rateLimit = checkRateLimit('login', 5, 60);
    if (!rateLimit.allowed) {
      toast.error(`Muitas tentativas de login. Tente novamente em ${rateLimit.resetTime} segundos.`);
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.error) {
        toast.error(result.error);
        setIsLoading(false);
      } else {
        toast.success("Autenticação bem-sucedida! Carregando seu painel financeiro...");
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error('Ocorreu um erro inesperado ao tentar entrar.');
      setIsLoading(false);
    }
  };

  // Submit - Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanDoc = regDoc.replace(/\D/g, '');
    const cleanPhone = regPhone.replace(/\D/g, '');

    if (!cleanDoc || !regName || !regEmail || !regPassword || !cleanPhone) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (cleanPhone.length < 10) {
      toast.error("Por favor, informe um telefone/WhatsApp válido.");
      return;
    }

    if (regDocLookupStatus === 'loading') {
      toast.error("Aguarde a consulta do CPF/CNPJ ser concluída.");
      return;
    }

    if (regDocLookupStatus === 'error') {
      toast.error("CPF/CNPJ inválido ou não localizado. Corrija antes de continuar.");
      return;
    }

    if (regDocType === 'cnpj' && !regCompany) {
      toast.error("Não foi possível obter a Razão Social. Verifique o CNPJ.");
      return;
    }

    if (!isPasswordValid) {
      toast.error("A senha criada não atende aos requisitos mínimos de segurança.");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      toast.error("A confirmação de senha não coincide com a senha criada.");
      return;
    }

    const rateLimit = checkRateLimit('register', 3, 60);
    if (!rateLimit.allowed) {
      toast.error(`Muitas tentativas de cadastro. Tente novamente em ${rateLimit.resetTime} segundos.`);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (signUpError) {
        toast.error(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        // Format phone
        let formattedPhone = cleanPhone;
        if (cleanPhone.length === 10 || cleanPhone.length === 11) {
          formattedPhone = '55' + cleanPhone;
        }

        // Save profile data immediately (even before email confirmed)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: regEmail,
            name: regName,
            razao_social: regCompany || regName,
            cnpj: cleanDoc,
            phone: formattedPhone,
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Error saving profile:', profileError.message);
        }

        // Show email verification panel
        setVerifyEmail(regEmail);
        setActivePanel('verify');
        setIsLoading(false);
      }
    } catch (err) {
      toast.error("Ocorreu um erro ao criar a conta. Tente novamente.");
      setIsLoading(false);
    }
  };

  // Submit - Forgot Password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error("Forneça um endereço de e-mail válido.");
      return;
    }

    const rateLimit = checkRateLimit('forgot', 2, 60);
    if (!rateLimit.allowed) {
      toast.error(`Muitas solicitações de recuperação. Tente novamente em ${rateLimit.resetTime} segundos.`);
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setVerifyEmail(forgotEmail);
        setActivePanel('verify-forgot');
      }
    } catch (err) {
      toast.error("Erro ao solicitar recuperação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-center items-center p-4 relative overflow-x-hidden select-none">
      {/* Efeitos luminosos de fundo simulando o blur de confiança da marca */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-glow-radial pointer-events-none z-0"></div>
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Container Centralizado Principal */}
      <div className="w-full max-w-md z-10 flex flex-col items-center">
        
        {/* Logo e Cabeçalho de Identidade */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-[20px] flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 transition-transform hover:scale-105 duration-300">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Connect Finanças</h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide max-w-xs">A sua gestão financeira inteligente e simplificada.</p>
        </div>

        <div className="w-full relative min-h-[400px]">
          
          {/* ==================== TELA DE LOGIN ==================== */}
          <div 
            id="panel-login" 
            className={`glass-panel w-full rounded-[28px] p-8 shadow-2xl transition-all duration-300 ${
              activePanel === 'login' 
                ? 'opacity-100 scale-100 pointer-events-auto' 
                : 'opacity-0 scale-95 pointer-events-none absolute top-0 left-0 w-full hidden'
            }`}
          >
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              {/* Campo E-mail */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold tracking-widest text-slate-400 uppercase">E-mail</label>
                <div className="relative">
                  <input 
                    type="email" 
                    id="login-email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#f1f5f9] text-slate-900 placeholder-slate-400 font-medium px-5 py-3.5 rounded-full outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border border-transparent shadow-inner text-sm"
                    placeholder="nome@exemplo.com"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <i className="fas fa-envelope"></i>
                  </span>
                </div>
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">Senha</label>
                  <button 
                    type="button" 
                    onClick={() => handleSwitchPanel('forgot')} 
                    className="text-[11px] font-bold tracking-wider text-blue-400 hover:text-cyan-400 transition-colors cursor-pointer uppercase"
                  >
                    Esqueceu?
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    id="login-password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#f1f5f9] text-slate-900 placeholder-slate-400 font-medium pl-5 pr-12 py-3.5 rounded-full outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border border-transparent shadow-inner text-sm"
                    placeholder="Sua senha de acesso"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors px-1"
                  >
                    <i className={`far ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* Botão de Login */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-4 rounded-full shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 active:scale-[0.98] transition-all duration-200 text-xs tracking-widest uppercase flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "Entrar no Painel"
                )}
              </button>
            </form>

            {/* Divisor e Opção de Cadastro */}
            <div className="mt-8 pt-6 border-t border-slate-800/60 text-center">
              <p className="text-sm text-slate-400">
                Novo na Connect Finanças?{' '}
                <button 
                  onClick={() => handleSwitchPanel('register')} 
                  className="text-blue-400 hover:text-cyan-400 font-semibold transition-colors cursor-pointer focus:outline-none"
                >
                  Criar Conta
                </button>
              </p>
            </div>
          </div>

          {/* ==================== TELA DE CADASTRO ==================== */}
          <div 
            id="panel-register" 
            className={`glass-panel w-full rounded-[28px] p-8 shadow-2xl transition-all duration-300 ${
              activePanel === 'register' 
                ? 'opacity-100 scale-100 pointer-events-auto' 
                : 'opacity-0 scale-95 pointer-events-none absolute top-0 left-0 w-full hidden'
            }`}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Crie sua Conta</h2>
              <span className="text-xs text-blue-400 font-semibold px-2.5 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">Você está quase lá</span>
            </div>
            
            <form onSubmit={handleRegisterSubmit} className="space-y-4">

              {/* ── STEP 1: CPF / CNPJ (primeiro campo, obrigatório) ── */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  CPF ou CNPJ
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="reg-doc"
                    required
                    autoFocus
                    maxLength={18}
                    value={regDoc}
                    onChange={handleDocChange}
                    className={`w-full font-medium px-5 py-3 pr-11 rounded-full outline-none focus:ring-2 transition-all border shadow-inner text-xs
                      ${regDocLookupStatus === 'found'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-400 focus:ring-emerald-400/40'
                        : regDocLookupStatus === 'error'
                        ? 'bg-rose-50 text-rose-900 border-rose-400 focus:ring-rose-400/40'
                        : 'bg-[#f1f5f9] text-slate-900 border-transparent focus:ring-blue-500/50'
                      }`}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  />
                  {/* Status icon */}
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
                    {regDocLookupStatus === 'loading' && (
                      <i className="fas fa-spinner fa-spin text-blue-400" />
                    )}
                    {regDocLookupStatus === 'found' && (
                      <i className="fas fa-check-circle text-emerald-500" />
                    )}
                    {regDocLookupStatus === 'error' && (
                      <i className="fas fa-times-circle text-rose-500" />
                    )}
                  </span>
                </div>
                {/* Hint message below field */}
                {regDocLookupStatus === 'idle' && (
                  <p className="text-[10px] text-slate-500 px-2">
                    Digite seu CPF (pessoa física) ou CNPJ (empresa). Os dados serão preenchidos automaticamente.
                  </p>
                )}
                {regDocLookupStatus === 'loading' && (
                  <p className="text-[10px] text-blue-400 px-2 animate-pulse">
                    Consultando Receita Federal...
                  </p>
                )}
                {regDocLookupStatus === 'found' && regDocType === 'cnpj' && (
                  <p className="text-[10px] text-emerald-400 px-2">
                    ✓ Empresa localizada na Receita Federal.
                  </p>
                )}
                {regDocLookupStatus === 'found' && regDocType === 'cpf' && (
                  <p className="text-[10px] text-emerald-400 px-2">
                    ✓ CPF válido. Preencha seu nome abaixo.
                  </p>
                )}
                {regDocLookupStatus === 'error' && (
                  <p className="text-[10px] text-rose-400 px-2">
                    ✗ CPF/CNPJ inválido ou não encontrado. Verifique e tente novamente.
                  </p>
                )}
              </div>

              {/* ── STEP 2: Campos preenchidos automaticamente (desbloqueiam após lookup) ── */}
              <div className={`space-y-4 transition-all duration-300 ${regDocLookupStatus === 'found' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>

                {/* Nome Completo / Nome Fantasia */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    {regDocType === 'cnpj' ? 'Nome Fantasia / Representante' : 'Nome Completo'}
                  </label>
                  <input
                    type="text"
                    id="reg-name"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-[#f1f5f9] text-slate-900 placeholder-slate-400 font-medium px-5 py-3 rounded-full outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border border-transparent shadow-inner text-xs"
                    placeholder={regDocType === 'cnpj' ? 'Preenchido automaticamente' : 'Seu nome completo'}
                  />
                </div>

                {/* Telefone / WhatsApp */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    id="reg-phone"
                    required
                    value={regPhone}
                    onChange={handlePhoneChange}
                    className="w-full bg-[#f1f5f9] text-slate-900 placeholder-slate-400 font-medium px-5 py-3 rounded-full outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border border-transparent shadow-inner text-xs"
                    placeholder="(99) 99999-9999"
                  />
                </div>

                {/* Razão Social (apenas para CNPJ) */}
                {regDocType === 'cnpj' && (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                      Razão Social
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="reg-company"
                        value={regCompany}
                        readOnly
                        className="w-full bg-emerald-50/80 text-emerald-900 font-medium px-5 py-3 pr-10 rounded-full outline-none border border-emerald-200 shadow-inner text-xs cursor-not-allowed"
                        placeholder="Preenchida automaticamente pela Receita Federal"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 text-xs pointer-events-none">
                        <i className="fas fa-lock" />
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 px-2">Obtida diretamente da Receita Federal.</p>
                  </div>
                )}

              </div>

              {/* E-mail */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">Seu E-mail</label>
                <input 
                  type="email" 
                  id="reg-email" 
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-[#f1f5f9] text-slate-900 placeholder-slate-400 font-medium px-5 py-3 rounded-full outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border border-transparent shadow-inner text-xs"
                  placeholder="exemplo@seuemail.com"
                />
              </div>

              {/* Senha e Validações */}
              <div className="space-y-1.5 relative">
                <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">Criar Senha</label>
                <div className="relative">
                  <input 
                    type={showRegPassword ? "text" : "password"} 
                    id="reg-password" 
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-[#f1f5f9] text-slate-900 placeholder-slate-400 font-medium pl-5 pr-12 py-3 rounded-full outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border border-transparent shadow-inner text-xs"
                    placeholder="Crie uma senha forte"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowRegPassword(!showRegPassword)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors px-1"
                  >
                    <i className={`far ${showRegPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                
                {/* Checklist interativo */}
                <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3.5 space-y-2 mt-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">A senha precisa conter:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className={`flex items-center gap-2 text-[11px] transition-all duration-200 ${hasMinLength ? 'text-emerald-400' : 'text-slate-400'}`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] transition-all duration-300 ${hasMinLength ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800/60 text-rose-500'}`}>
                        <i className={`fas ${hasMinLength ? 'fa-check' : 'fa-times'}`}></i>
                      </span>
                      <span>8+ caracteres</span>
                    </div>
                    <div className={`flex items-center gap-2 text-[11px] transition-all duration-200 ${hasUppercase ? 'text-emerald-400' : 'text-slate-400'}`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] transition-all duration-300 ${hasUppercase ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800/60 text-rose-500'}`}>
                        <i className={`fas ${hasUppercase ? 'fa-check' : 'fa-times'}`}></i>
                      </span>
                      <span>Letra Maiúscula</span>
                    </div>
                    <div className={`flex items-center gap-2 text-[11px] transition-all duration-200 ${hasSpecial ? 'text-emerald-400' : 'text-slate-400'}`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] transition-all duration-300 ${hasSpecial ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800/60 text-rose-500'}`}>
                        <i className={`fas ${hasSpecial ? 'fa-check' : 'fa-times'}`}></i>
                      </span>
                      <span>Carac. Especial</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">Confirmar Senha</label>
                <div className="relative">
                  <input 
                    type={showRegConfirmPassword ? "text" : "password"} 
                    id="reg-confirm-password" 
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full bg-[#f1f5f9] text-slate-900 placeholder-slate-400 font-medium pl-5 pr-12 py-3 rounded-full outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border border-transparent shadow-inner text-xs"
                    placeholder="Confirme sua senha exatamente igual"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)} 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors px-1"
                  >
                    <i className={`far ${showRegConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* Botão de Cadastro */}
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-full shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 active:scale-[0.98] transition-all duration-200 text-xs tracking-widest uppercase flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    "Criar Minha Conta"
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800/60 text-center">
              <p className="text-xs text-slate-400">
                Já tem uma conta ativa?{' '}
                <button 
                  onClick={() => handleSwitchPanel('login')} 
                  className="text-blue-400 hover:text-cyan-400 font-semibold transition-colors cursor-pointer focus:outline-none"
                >
                  Fazer Login
                </button>
              </p>
            </div>
          </div>

          {/* ==================== TELA DE RECUPERAR SENHA ==================== */}
          <div 
            id="panel-forgot" 
            className={`glass-panel w-full rounded-[28px] p-8 shadow-2xl transition-all duration-300 ${
              activePanel === 'forgot' 
                ? 'opacity-100 scale-100 pointer-events-auto' 
                : 'opacity-0 scale-95 pointer-events-none absolute top-0 left-0 w-full hidden'
            }`}
          >
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white mb-1">Recuperar Senha</h2>
              <p className="text-xs text-slate-400 leading-relaxed">Insira seu endereço de e-mail cadastrado e lhe enviaremos as instruções para redefinir o acesso.</p>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-6">
              {/* Campo E-mail */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold tracking-widest text-slate-400 uppercase">E-mail Cadastrado</label>
                <div className="relative">
                  <input 
                    type="email" 
                    id="forgot-email" 
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-[#f1f5f9] text-slate-900 placeholder-slate-400 font-medium px-5 py-3.5 rounded-full outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border border-transparent shadow-inner text-sm"
                    placeholder="nome@empresa.com"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <i className="fas fa-envelope"></i>
                  </span>
                </div>
              </div>

              {/* Botão de Recuperação */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-4 rounded-full shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 active:scale-[0.98] transition-all duration-200 text-xs tracking-widest uppercase flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "Enviar Link de Redefinição"
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800/60 text-center flex justify-center items-center gap-2">
              <button 
                onClick={() => handleSwitchPanel('login')} 
                className="text-xs text-blue-400 hover:text-cyan-400 font-semibold transition-colors flex items-center gap-2 focus:outline-none"
              >
                <i className="fas fa-arrow-left text-[10px]"></i> Voltar ao painel de login
              </button>
            </div>
          </div>

          {/* ==================== TELA DE VERIFICAÇÃO (PÓS-CADASTRO) ==================== */}
          <div
            id="panel-verify"
            className={`glass-panel w-full rounded-[28px] p-8 shadow-2xl transition-all duration-300 ${
              activePanel === 'verify'
                ? 'opacity-100 scale-100 pointer-events-auto'
                : 'opacity-0 scale-95 pointer-events-none absolute top-0 left-0 w-full hidden'
            }`}
          >
            {/* Ícone */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-envelope-open-text text-emerald-400 text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Verifique seu e-mail</h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Enviamos um <strong className="text-white">link de confirmação</strong> para:
              </p>
              <p className="text-blue-400 font-semibold text-sm mt-1 break-all">{verifyEmail}</p>
            </div>

            {/* Instruções */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                <p className="text-slate-300 text-xs">Abra seu e-mail em <strong className="text-white">{verifyEmail}</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                <p className="text-slate-300 text-xs">Clique no botão <strong className="text-white">"Confirmar meu e-mail"</strong> na mensagem enviada pela Connect Finanças</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                <p className="text-slate-300 text-xs">Após confirmar, volte aqui e faça seu login normalmente</p>
              </div>
            </div>

            <p className="text-slate-500 text-[10px] text-center mb-4">
              Não recebeu? Verifique sua caixa de spam ou lixo eletrônico.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleResendEmail('signup')}
                disabled={resendTimer > 0 || isLoading}
                className="w-full border border-slate-700 hover:border-slate-600 bg-slate-900/60 text-slate-300 hover:text-white font-semibold py-3.5 rounded-full transition-all text-xs tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <i className="fas fa-redo-alt" />
                    {resendTimer > 0 ? `Reenviar em ${resendTimer}s` : 'Reenviar E-mail'}
                  </>
                )}
              </button>

              <button
                onClick={() => { setEmail(verifyEmail); handleSwitchPanel('login'); }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-full shadow-lg active:scale-[0.98] transition-all text-xs tracking-widest uppercase"
              >
                Ir para o Login
              </button>
            </div>
          </div>

          {/* ==================== TELA DE VERIFICAÇÃO (PÓS-ESQUECI SENHA) ==================== */}
          <div
            id="panel-verify-forgot"
            className={`glass-panel w-full rounded-[28px] p-8 shadow-2xl transition-all duration-300 ${
              activePanel === 'verify-forgot'
                ? 'opacity-100 scale-100 pointer-events-auto'
                : 'opacity-0 scale-95 pointer-events-none absolute top-0 left-0 w-full hidden'
            }`}
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-key text-amber-400 text-2xl" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Verifique seu e-mail</h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Enviamos um <strong className="text-white">link para redefinir sua senha</strong> para:
              </p>
              <p className="text-blue-400 font-semibold text-sm mt-1 break-all">{verifyEmail}</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                <p className="text-slate-300 text-xs">Abra seu e-mail em <strong className="text-white">{verifyEmail}</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                <p className="text-slate-300 text-xs">Clique em <strong className="text-white">"Redefinir minha senha"</strong> na mensagem da Connect Finanças</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                <p className="text-slate-300 text-xs">Você será direcionado para criar uma nova senha segura</p>
              </div>
            </div>

            <p className="text-slate-500 text-[10px] text-center mb-4">
              Não recebeu? Verifique sua caixa de spam. O link expira em 1 hora.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleResendEmail('signup_forgot')}
                disabled={resendTimer > 0 || isLoading}
                className="w-full border border-slate-700 hover:border-slate-600 bg-slate-900/60 text-slate-300 hover:text-white font-semibold py-3.5 rounded-full transition-all text-xs tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                 {isLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <i className="fas fa-redo-alt" />
                    {resendTimer > 0 ? `Reenviar em ${resendTimer}s` : 'Reenviar E-mail'}
                  </>
                )}
              </button>

              <button
                onClick={() => handleSwitchPanel('login')}
                className="w-full bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-white font-semibold py-3.5 rounded-full transition-all text-xs tracking-widest uppercase flex items-center justify-center gap-2"
              >
                <i className="fas fa-arrow-left text-[10px]" />
                Voltar ao Login
              </button>
            </div>
          </div>

        </div>

        {/* Rodapé simples de Propriedade */}
        <p className="text-slate-500 text-[10px] mt-8 text-center font-medium tracking-wider uppercase">
          &copy; 2026 Connect Finanças. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
