import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando seu link de acesso...');

  useEffect(() => {
    const hash = window.location.hash;
    
    if (!hash) {
      navigate('/login', { replace: true });
      return;
    }

    const hashParams = new URLSearchParams(hash.substring(1));
    const error = hashParams.get('error');
    const errorCode = hashParams.get('error_code');
    const errorDescription = hashParams.get('error_description');
    const type = hashParams.get('type');

    if (error) {
      setStatus('error');
      if (errorCode === 'otp_expired') {
        setMessage('Este link expirou ou já foi utilizado. Por favor, solicite um novo link de acesso.');
      } else {
        setMessage(errorDescription ? decodeURIComponent(errorDescription.replace(/\+/g, ' ')) : 'Ocorreu um erro ao verificar seu link.');
      }
      
      // Limpa o hash da URL
      window.history.replaceState(null, '', window.location.pathname);
      
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 5000);
      return;
    }

    if (hashParams.get('access_token')) {
      setStatus('success');
      if (type === 'recovery') {
        setMessage('Acesso confirmado! Redirecionando para redefinição de senha...');
        setTimeout(() => {
          navigate('/reset-password' + hash, { replace: true });
        }, 3000);
      } else {
        setMessage('E-mail verificado com sucesso! Redirecionando para o sistema...');
        // O Supabase onAuthStateChange vai lidar com o login real
        // Limpamos o hash para a URL ficar limpa
        window.history.replaceState(null, '', window.location.pathname);
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 3000);
      }
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
        {status === 'loading' && (
          <>
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
              <div className="h-full bg-blue-500 animate-pulse w-full"></div>
            </div>
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">Aguarde um momento</h2>
            <p className="text-slate-400 text-sm">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500/20">
              <div className="h-full bg-red-500 w-full animate-[shrink_5s_linear_forwards]"></div>
            </div>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Link Inválido</h2>
            <p className="text-red-400 text-sm mb-6">{message}</p>
            <p className="text-slate-500 text-xs">Redirecionando em 5 segundos...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20">
              <div className="h-full bg-emerald-500 w-full animate-[shrink_3s_linear_forwards]"></div>
            </div>
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Sucesso!</h2>
            <p className="text-emerald-400 text-sm mb-6">{message}</p>
            <p className="text-slate-500 text-xs">Redirecionando...</p>
          </>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}} />
    </div>
  );
}
