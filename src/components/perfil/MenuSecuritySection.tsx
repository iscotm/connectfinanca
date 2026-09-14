import React, { useState, useEffect } from 'react';
import { useMenuSecurity, ALL_PROTECTABLE_MENUS } from '@/contexts/MenuSecurityContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  Mail,
  AlertCircle,
  Save,
  Trash2,
  Send,
  RotateCcw,
  CheckSquare,
  Square
} from 'lucide-react';
import { toast } from 'sonner';

export function MenuSecuritySection() {
  const { user } = useAuth();
  const {
    settings,
    pendingVerificationCode,
    sendEmailVerificationCode,
    saveSecuritySettings,
    removeSecurityPin
  } = useMenuSecurity();

  const [pin, setPin] = useState(settings.pin || '');
  const [confirmPin, setConfirmPin] = useState(settings.pin || '');
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>(settings.protectedRoutes || []);

  // Modal / Verification Code state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionType, setActionType] = useState<'save' | 'remove'>('save');

  // Sync with loaded settings
  useEffect(() => {
    setPin(settings.pin || '');
    setConfirmPin(settings.pin || '');
    setSelectedRoutes(settings.protectedRoutes || []);
  }, [settings]);

  const handleToggleRoute = (routeId: string) => {
    setSelectedRoutes(prev =>
      prev.includes(routeId)
        ? prev.filter(r => r !== routeId)
        : [...prev, routeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRoutes.length === ALL_PROTECTABLE_MENUS.length) {
      setSelectedRoutes([]);
    } else {
      setSelectedRoutes(ALL_PROTECTABLE_MENUS.map(m => m.id));
    }
  };

  const handleStartSave = async () => {
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast.error('A senha deve conter exatamente 4 números.');
      return;
    }

    if (pin !== confirmPin) {
      toast.error('As senhas de 4 dígitos não coincidem.');
      return;
    }

    if (selectedRoutes.length === 0) {
      toast.error('Selecione ao menos um menu para proteger com a senha.');
      return;
    }

    setActionType('save');
    setIsVerifying(true);
    setVerificationCode('');
    setIsSendingCode(true);

    const res = await sendEmailVerificationCode();
    setIsSendingCode(false);
    if (!res.success) {
      toast.error(res.error || 'Erro ao enviar código de verificação.');
    }
  };

  const handleStartRemove = async () => {
    setActionType('remove');
    setIsVerifying(true);
    setVerificationCode('');
    setIsSendingCode(true);

    const res = await sendEmailVerificationCode();
    setIsSendingCode(false);
    if (!res.success) {
      toast.error(res.error || 'Erro ao enviar código de verificação.');
    }
  };

  const handleConfirmAction = async () => {
    if (!verificationCode || verificationCode.trim().length < 6) {
      toast.error('Digite o código de 6 dígitos recebido por e-mail.');
      return;
    }

    setIsSaving(true);

    if (actionType === 'save') {
      const res = await saveSecuritySettings(
        {
          isEnabled: true,
          pin,
          protectedRoutes: selectedRoutes,
        },
        verificationCode
      );
      setIsSaving(false);

      if (res.success) {
        setIsVerifying(false);
      } else {
        toast.error(res.error || 'Erro ao validar código.');
      }
    } else {
      const res = await removeSecurityPin(verificationCode);
      setIsSaving(false);

      if (res.success) {
        setIsVerifying(false);
        setPin('');
        setConfirmPin('');
        setSelectedRoutes([]);
      } else {
        toast.error(res.error || 'Erro ao validar código.');
      }
    }
  };

  const handleResendCode = async () => {
    setIsSendingCode(true);
    const res = await sendEmailVerificationCode();
    setIsSendingCode(false);
    if (res.success) {
      toast.success('Novo código enviado para seu e-mail!');
    }
  };

  return (
    <section className="glass-panel border border-slate-900/50 p-6 sm:p-7 rounded-3xl shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 text-blue-400 border border-blue-500/30">
            <KeyRound size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white">
                Senha de Acesso aos Menus (PIN 4 Dígitos)
              </h2>
              {settings.isEnabled && settings.pin ? (
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  <CheckCircle2 size={10} /> Ativado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-400 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-slate-700">
                  Desativado
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Defina um PIN numérico para proteger e ocultar o conteúdo dos menus selecionados da barra lateral.
            </p>
          </div>
        </div>

        {settings.isEnabled && settings.pin && (
          <button
            type="button"
            onClick={handleStartRemove}
            className="px-4 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Desativar Senha</span>
          </button>
        )}
      </div>

      {/* Form Fields: PIN and Confirmation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
            <Lock size={13} className="text-blue-400" />
            <span>Senha de 4 Dígitos</span>
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Ex: 1234"
            className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all outline-none text-base tracking-widest font-bold"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-blue-400" />
            <span>Confirmar Senha</span>
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Repita a senha de 4 dígitos"
            className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 text-white placeholder-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all outline-none text-base tracking-widest font-bold"
          />
        </div>
      </div>

      {/* Protectable Menus Selection */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck size={16} className="text-blue-400" />
            <span>Escolha quais menus terão proteção por senha:</span>
          </label>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            {selectedRoutes.length === ALL_PROTECTABLE_MENUS.length ? (
              <>
                <CheckSquare size={14} />
                <span>Desmarcar Todos</span>
              </>
            ) : (
              <>
                <Square size={14} />
                <span>Selecionar Todos</span>
              </>
            )}
          </button>
        </div>

        {/* Checkbox Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {ALL_PROTECTABLE_MENUS.map((menu) => {
            const isChecked = selectedRoutes.includes(menu.id);
            return (
              <div
                key={menu.id}
                onClick={() => handleToggleRoute(menu.id)}
                className={`
                  p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none
                  ${isChecked
                    ? 'bg-blue-600/15 border-blue-500/60 text-white shadow-sm shadow-blue-500/10'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900/70 hover:text-slate-200'
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                    isChecked ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700 bg-slate-900'
                  }`}>
                    {isChecked && <CheckCircle2 size={12} />}
                  </div>
                  <span className="text-xs font-bold">{menu.label}</span>
                </div>
                {isChecked && <Lock size={13} className="text-blue-400" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info note */}
      <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/15 flex items-start gap-2.5 text-xs text-slate-300">
        <AlertCircle size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <span>
          O menu <strong>Perfil</strong> permanece sempre liberado para permitir que você gerencie seus dados e altere suas senhas a qualquer momento. Para confirmar a criação ou alteração da senha, você receberá um código no seu e-mail cadastrado (<strong>{user?.email}</strong>).
        </span>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleStartSave}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer"
        >
          <Save size={16} />
          <span>Salvar Senha e Menus</span>
        </button>
      </div>

      {/* Modal / Dialog de Verificação por Código de E-mail */}
      {isVerifying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-600/30">
                <Mail size={26} />
              </div>
              <h3 className="text-xl font-black text-white">Confirmar no E-mail</h3>
              <p className="text-xs text-slate-400">
                Enviamos um código de segurança de 6 dígitos para o e-mail:
                <br />
                <strong className="text-white">{user?.email}</strong>
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
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-2xl font-black tracking-[0.3em] py-3.5 bg-slate-950/80 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl outline-none"
                autoFocus
              />
            </div>

            {pendingVerificationCode && (
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 text-[10px]">
                  Código de confirmação: <strong className="text-white font-mono text-xs">{pendingVerificationCode}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setVerificationCode(pendingVerificationCode)}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
                >
                  Preencher
                </button>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Não recebeu o código?</span>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isSendingCode}
                className="font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw size={12} className={isSendingCode ? "animate-spin" : ""} />
                <span>Reenviar</span>
              </button>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsVerifying(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isSaving || verificationCode.length < 6}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Confirmar</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
