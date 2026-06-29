import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck, Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Se já estiver logado
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        // Se for usuário comum tentando acessar login de admin, desloga
        toast.error('Acesso restrito. Apenas administradores.');
        logout();
      }
    }
  }, [isAuthenticated, user, navigate, logout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsLoggingIn(true);
    const { error } = await login(email, password);
    setIsLoggingIn(false);

    if (error) {
      toast.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 selection:bg-blue-500/30 selection:text-blue-200">
      <div className="w-full max-w-md">
        {/* Back to normal login */}
        <button 
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm font-medium mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para login de clientes
        </button>

        <div className="glass-panel p-8 rounded-3xl border border-slate-800/60 bg-slate-900/40 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ShieldCheck size={120} />
          </div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 shadow-lg shadow-blue-500/10">
              <ShieldCheck size={32} />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Admin SaaS</h1>
            <p className="text-slate-400 text-sm mb-8">Acesso restrito à gestão do sistema.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">E-mail Administrativo</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@seudominio.com"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Autenticando...
                  </>
                ) : (
                  'Entrar no Painel'
                )}
              </button>
            </form>
          </div>
        </div>
        
        <p className="text-center text-xs text-slate-600 mt-8">
          © {new Date().getFullYear()} Connect Finanças. Acesso monitorado.
        </p>
      </div>
    </div>
  );
}
