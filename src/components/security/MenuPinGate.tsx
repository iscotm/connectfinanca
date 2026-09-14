import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMenuSecurity } from '@/contexts/MenuSecurityContext';
import { Lock, ShieldAlert, ArrowLeft, KeyRound, CheckCircle2, User } from 'lucide-react';
import { toast } from 'sonner';

interface MenuPinGateProps {
  children: React.ReactNode;
}

export function MenuPinGate({ children }: MenuPinGateProps) {
  const { isRouteProtected, isUnlocked, unlock } = useMenuSecurity();
  const location = useLocation();
  const navigate = useNavigate();

  const isProtected = isRouteProtected(location.pathname);
  const [pin, setPin] = useState(['', '', '', '']);
  const [errorShake, setErrorShake] = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Reset PIN input when entering a protected route or when locked
  useEffect(() => {
    if (isProtected && !isUnlocked) {
      setPin(['', '', '', '']);
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 100);
    }
  }, [location.pathname, isProtected, isUnlocked]);

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric
    const cleanValue = value.replace(/\D/g, '').slice(-1);

    const newPin = [...pin];
    newPin[index] = cleanValue;
    setPin(newPin);

    // Auto-focus next input
    if (cleanValue && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // When full 4 digits entered, auto-verify
    const fullPin = newPin.join('');
    if (fullPin.length === 4) {
      const success = unlock(fullPin);
      if (success) {
        toast.success('Acesso liberado com sucesso!');
      } else {
        setErrorShake(true);
        toast.error('Senha de 4 dígitos incorreta.');
        setTimeout(() => {
          setPin(['', '', '', '']);
          setErrorShake(false);
          inputRefs[0].current?.focus();
        }, 500);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  // If route is not protected or already unlocked, render children directly
  if (!isProtected || isUnlocked) {
    return <>{children}</>;
  }

  // Otherwise, display PIN lock overlay
  return (
    <div className="relative w-full min-h-[75vh] flex items-center justify-center p-4">
      {/* Content completely hidden until unlocked */}

      {/* Lock Card */}
      <div className="relative z-20 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className={`
          glass-panel bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center text-center backdrop-blur-2xl
          ${errorShake ? 'animate-shake border-rose-500/60 ring-2 ring-rose-500/30' : 'hover:border-slate-700'}
        `}>
          
          {/* Lock Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/30 mb-6 border border-blue-400/30">
            <Lock size={30} />
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            Acesso Protegido por Senha
          </h2>
          <p className="text-sm text-slate-400 max-w-xs mb-8">
            Este menu foi configurado com bloqueio de segurança. Digite seu PIN de 4 dígitos para visualizar o conteúdo.
          </p>

          {/* 4-Digit Input Boxes */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`
                  w-14 h-16 sm:w-16 sm:h-18 text-center text-2xl font-black rounded-2xl outline-none transition-all
                  bg-slate-950/80 border text-white
                  ${digit ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-950/20' : 'border-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20'}
                `}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Helper Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
            <button
              onClick={() => navigate('/perfil')}
              className="w-full py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-slate-700/80 cursor-pointer"
            >
              <User size={14} className="text-blue-400" />
              <span>Ir para o Perfil</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
