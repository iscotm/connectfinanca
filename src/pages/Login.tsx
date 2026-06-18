import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Panels: 'login' | 'register' | 'forgot'
  const [activePanel, setActivePanel] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);

  // Form states - Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form states - Register
  const [regName, setRegName] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regCnpj, setRegCnpj] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Form states - Forgot
  const [forgotEmail, setForgotEmail] = useState('');

  // Password validation checks
  const hasMinLength = regPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(regPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_]/.test(regPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasSpecial;

  // Handle CNPJ masking
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    if (value.length > 2) value = value.slice(0, 2) + '.' + value.slice(2);
    if (value.length > 6) value = value.slice(0, 6) + '.' + value.slice(6);
    if (value.length > 10) value = value.slice(0, 10) + '/' + value.slice(10);
    if (value.length > 15) value = value.slice(0, 15) + '-' + value.slice(15, 17);
    
    setRegCnpj(value);
  };

  // Switch panels helper
  const handleSwitchPanel = (panel: 'login' | 'register' | 'forgot') => {
    setActivePanel(panel);
  };

  // Submit - Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos obrigatórios para prosseguir.");
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

    if (!regName || !regCompany || !regCnpj || !regEmail || !regPassword) {
      toast.error("Preencha todos os campos obrigatórios.");
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

    if (regCnpj.length < 18) {
      toast.error("Por favor, preencha o CNPJ completo corporativo.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
      });

      if (signUpError) {
        toast.error(signUpError.message);
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: regEmail,
            name: regName,
            razao_social: regCompany,
            cnpj: regCnpj,
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Error updating profile:', profileError.message);
        }

        toast.success(`Conta criada para ${regName} (${regCompany}). Bem-vindo ao Connect Finanças!`);
        
        setTimeout(() => {
          setEmail(regEmail);
          setActivePanel('login');
          setIsLoading(false);
        }, 2000);
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
      toast.error("Forneça um endereço de e-mail válido corporativo.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Link de redefinição enviado com sucesso para ${forgotEmail}.`);
        setTimeout(() => {
          setActivePanel('login');
        }, 3000);
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
                <div class="relative">
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
              {/* Nome Completo */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">Nome Completo</label>
                <input 
                  type="text" 
                  id="reg-name" 
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-[#f1f5f9] text-slate-900 placeholder-slate-400 font-medium px-5 py-3 rounded-full outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border border-transparent shadow-inner text-xs"
                  placeholder="Seu nome completo"
                />
              </div>

              {/* Dados Corporativos: Empresa & CNPJ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Empresa */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">Empresa</label>
                  <input 
                    type="text" 
                    id="reg-company" 
                    required
                    value={regCompany}
                    onChange={(e) => setRegCompany(e.target.value)}
                    className="w-full bg-[#f1f5f9] text-slate-900 placeholder-slate-400 font-medium px-5 py-3 rounded-full outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border border-transparent shadow-inner text-xs"
                    placeholder="Nome da empresa"
                  />
                </div>
                {/* CNPJ com máscara automática */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">CNPJ</label>
                  <input 
                    type="text" 
                    id="reg-cnpj" 
                    required 
                    maxLength={18}
                    value={regCnpj}
                    onChange={handleCnpjChange}
                    className="w-full bg-[#f1f5f9] text-slate-900 placeholder-slate-400 font-medium px-5 py-3 rounded-full outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border border-transparent shadow-inner text-xs"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
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

        </div>

        {/* Rodapé simples de Propriedade */}
        <p className="text-slate-500 text-[10px] mt-8 text-center font-medium tracking-wider uppercase">
          &copy; 2026 Connect Finanças. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
