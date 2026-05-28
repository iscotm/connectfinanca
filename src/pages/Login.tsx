import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado ao tentar entrar.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-['Plus_Jakarta_Sans',_sans-serif]">
      <div className="bg-animate"></div>
      <div className="blob"></div>

      <div className="w-full max-w-md">
        {/* Logo Central */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-pink-950/40">
            <TrendingUp size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Connect Finanças</h1>
          <p className="text-slate-400 mt-2 text-center text-sm px-8">A sua gestão financeira inteligente e simplificada.</p>
        </div>

        {/* Card de Login */}
        <div className="login-card rounded-[2rem] p-8 md:p-10 relative z-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2 ml-1">E-mail</label>
              <input
                type="email"
                id="email"
                required
                className="input-field w-full px-5 py-4 rounded-2xl text-sm placeholder:text-slate-600"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest text-slate-400">Senha</label>
                <a href="#" className="text-xs font-medium text-pink-400 hover:text-pink-300 transition-colors">Esqueceu?</a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="input-field w-full px-5 py-4 pr-14 rounded-2xl text-sm placeholder:text-slate-600"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="eye-button absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-500 flex items-center justify-center"
                  aria-label="Mostrar ou ocultar senha"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary-gradient w-full py-4 rounded-2xl text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center space-x-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>A processar...</span>
                  </>
                ) : (
                  <span>Entrar no Painel</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
