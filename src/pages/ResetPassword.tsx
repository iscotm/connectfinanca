import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState('');

  // Password strength
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasSpecial;

  useEffect(() => {
    // Supabase sends the recovery token via URL hash (#access_token=...) or query (?code=...)
    // The auth listener handles the hash automatically; for PKCE flow it uses ?code=
    const code = searchParams.get('code');

    const initSession = async () => {
      if (code) {
        // PKCE flow: exchange code for session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setSessionError('Link inválido ou expirado. Solicite um novo link de redefinição.');
          return;
        }
      }

      // Check if there's already a session (hash-based flow sets it automatically)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsSessionReady(true);
      } else {
        setSessionError('Link inválido ou expirado. Solicite um novo link de redefinição.');
      }
    };

    initSession();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast.error('A senha não atende aos requisitos mínimos de segurança.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Senha redefinida com sucesso! Faça seu login.');
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch {
      toast.error('Erro ao redefinir senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-center items-center p-4 relative overflow-x-hidden select-none">
      {/* Background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-glow-radial pointer-events-none z-0" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-[20px] flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Connect Finanças</h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide max-w-xs">Redefinição de senha</p>
        </div>

        <div className="glass-panel w-full rounded-[28px] p-8 shadow-2xl">

          {/* ── SESSION ERROR STATE ── */}
          {sessionError ? (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/30 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-rose-400 text-2xl" />
              </div>
              <h2 className="text-lg font-bold text-white">Link Inválido</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{sessionError}</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-full transition-all text-xs tracking-widest uppercase mt-2"
              >
                Voltar ao Login
              </button>
            </div>
          ) : !isSessionReady ? (
            /* ── LOADING STATE ── */
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Verificando link de recuperação...</p>
            </div>
          ) : (
            /* ── RESET PASSWORD FORM ── */
            <>
              <div className="mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center justify-center">
                  <i className="fas fa-lock text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Nova Senha</h2>
                  <p className="text-xs text-slate-400">Crie uma senha segura para sua conta</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nova Senha */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">Nova Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="new-password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#f1f5f9] text-slate-900 placeholder-slate-400 font-medium pl-5 pr-12 py-3 rounded-full outline-none focus:ring-2 focus:ring-blue-500/50 transition-all border border-transparent shadow-inner text-xs"
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors px-1"
                    >
                      <i className={`far ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>

                  {/* Password checklist */}
                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3 space-y-2 mt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">A senha precisa conter:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { ok: hasMinLength, label: '8+ caracteres' },
                        { ok: hasUppercase, label: 'Letra Maiúscula' },
                        { ok: hasSpecial, label: 'Carac. Especial' },
                      ].map(({ ok, label }) => (
                        <div key={label} className={`flex items-center gap-1.5 text-[11px] transition-all duration-200 ${ok ? 'text-emerald-400' : 'text-slate-400'}`}>
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] transition-all duration-300 ${ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800/60 text-rose-500'}`}>
                            <i className={`fas ${ok ? 'fa-check' : 'fa-times'}`} />
                          </span>
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Confirmar Senha */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold tracking-widest text-slate-400 uppercase">Confirmar Nova Senha</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirm-new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full font-medium pl-5 pr-12 py-3 rounded-full outline-none focus:ring-2 transition-all border shadow-inner text-xs
                        ${confirmPassword && confirmPassword !== newPassword
                          ? 'bg-rose-50 text-rose-900 border-rose-300 focus:ring-rose-400/40'
                          : confirmPassword && confirmPassword === newPassword
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300 focus:ring-emerald-400/40'
                          : 'bg-[#f1f5f9] text-slate-900 border-transparent focus:ring-blue-500/50'
                        }`}
                      placeholder="Repita a nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors px-1"
                    >
                      <i className={`far ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                    {confirmPassword && (
                      <span className="absolute right-10 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
                        {confirmPassword === newPassword
                          ? <i className="fas fa-check-circle text-emerald-500" />
                          : <i className="fas fa-times-circle text-rose-500" />
                        }
                      </span>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || !isPasswordValid || newPassword !== confirmPassword}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-full shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all text-xs tracking-widest uppercase flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <i className="fas fa-shield-alt" />
                        Redefinir Senha
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <p className="text-slate-500 text-[10px] mt-8 text-center font-medium tracking-wider uppercase">
          &copy; 2026 Connect Finanças. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
