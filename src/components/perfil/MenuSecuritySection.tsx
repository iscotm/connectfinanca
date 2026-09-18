import React, { useState, useEffect } from 'react';
import { useMenuSecurity, ALL_PROTECTABLE_MENUS, AccessKey } from '@/contexts/MenuSecurityContext';
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
  Plus,
  RotateCcw,
  CheckSquare,
  Square,
  Edit2,
  User,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export function MenuSecuritySection() {
  const { user } = useAuth();
  const {
    settings,
    pendingVerificationCode,
    sendEmailVerificationCode,
    saveSettings
  } = useMenuSecurity();

  // Mode: 'overview', 'edit-profile', 'edit-key'
  const [mode, setMode] = useState<'overview' | 'edit-profile' | 'edit-key'>('overview');
  
  // States for Profile Lock
  const [profileLocked, setProfileLocked] = useState(false);
  const [profilePin, setProfilePin] = useState('');
  
  // States for Access Key
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [keyName, setKeyName] = useState('');
  const [keyPin, setKeyPin] = useState('');
  const [keyRoutes, setKeyRoutes] = useState<string[]>([]);
  
  // Verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // What are we saving right now?
  const [pendingSaveAction, setPendingSaveAction] = useState<() => Promise<void>>();

  // Open Profile Edit
  const handleOpenProfileEdit = () => {
    setProfileLocked(settings.isProfileLocked);
    setProfilePin(settings.profilePin || '');
    setMode('edit-profile');
  };

  // Open Key Edit/Create
  const handleOpenKeyEdit = (key?: AccessKey) => {
    if (key) {
      setEditingKeyId(key.id);
      setKeyName(key.name);
      setKeyPin(key.pin);
      setKeyRoutes(key.protectedRoutes);
    } else {
      setEditingKeyId(null);
      setKeyName('');
      setKeyPin('');
      setKeyRoutes([]);
    }
    setMode('edit-key');
  };

  const handleToggleRoute = (routeId: string) => {
    setKeyRoutes(prev =>
      prev.includes(routeId)
        ? prev.filter(r => r !== routeId)
        : [...prev, routeId]
    );
  };

  const handleSelectAll = () => {
    if (keyRoutes.length === ALL_PROTECTABLE_MENUS.length) {
      setKeyRoutes([]);
    } else {
      setKeyRoutes(ALL_PROTECTABLE_MENUS.map(m => m.id));
    }
  };

  // Generic Save Request
  const requestVerification = async (action: () => Promise<void>) => {
    setPendingSaveAction(() => action);
    setIsVerifying(true);
    setVerificationCode('');
    setIsSendingCode(true);

    const res = await sendEmailVerificationCode();
    setIsSendingCode(false);
    if (!res.success) {
      toast.error(res.error || 'Erro ao enviar código de verificação.');
      setIsVerifying(false);
    }
  };

  // Confirm Verification
  const handleConfirmAction = async () => {
    if (!verificationCode || verificationCode.trim().length < 6) {
      toast.error('Digite o código de 6 dígitos recebido por e-mail.');
      return;
    }

    if (!pendingSaveAction) return;

    setIsSaving(true);
    await pendingSaveAction();
    setIsSaving(false);
  };

  const handleResendCode = async () => {
    setIsSendingCode(true);
    const res = await sendEmailVerificationCode();
    setIsSendingCode(false);
    if (res.success) {
      toast.success('Novo código enviado para seu e-mail!');
    }
  };

  // Action: Save Profile Lock
  const saveProfileLock = async () => {
    if (profileLocked && (profilePin.length !== 4 || !/^\d{4}$/.test(profilePin))) {
      toast.error('A senha deve conter exatamente 4 números.');
      return;
    }
    
    await requestVerification(async () => {
      const newSettings = {
        ...settings,
        isProfileLocked: profileLocked,
        profilePin: profileLocked ? profilePin : '',
      };
      
      const res = await saveSettings(newSettings, verificationCode);
      if (res.success) {
         setIsVerifying(false);
         setMode('overview');
      } else {
         toast.error(res.error || 'Erro ao validar código.');
      }
    });
  };

  // Action: Save Access Key
  const saveAccessKey = async () => {
    if (!keyName.trim()) {
      toast.error('Dê um nome para a Chave de Acesso.');
      return;
    }
    if (keyPin.length !== 4 || !/^\d{4}$/.test(keyPin)) {
      toast.error('A senha deve conter exatamente 4 números.');
      return;
    }
    if (keyRoutes.length === 0) {
      toast.error('Selecione ao menos um menu para proteger com a senha.');
      return;
    }

    await requestVerification(async () => {
      let newKeys = [...settings.accessKeys];
      
      if (editingKeyId) {
        newKeys = newKeys.map(k => k.id === editingKeyId ? { id: k.id, name: keyName, pin: keyPin, protectedRoutes: keyRoutes } : k);
      } else {
        newKeys.push({
          id: crypto.randomUUID(),
          name: keyName,
          pin: keyPin,
          protectedRoutes: keyRoutes
        });
      }

      const newSettings = { ...settings, accessKeys: newKeys };
      const res = await saveSettings(newSettings, verificationCode);
      if (res.success) {
         setIsVerifying(false);
         setMode('overview');
      } else {
         toast.error(res.error || 'Erro ao validar código.');
      }
    });
  };

  // Action: Delete Access Key
  const deleteAccessKey = async (id: string) => {
    await requestVerification(async () => {
      const newSettings = { ...settings, accessKeys: settings.accessKeys.filter(k => k.id !== id) };
      const res = await saveSettings(newSettings, verificationCode);
      if (res.success) {
         setIsVerifying(false);
      } else {
         toast.error(res.error || 'Erro ao validar código.');
      }
    });
  };

  return (
    <section className="glass-panel border border-slate-900/50 p-6 sm:p-7 rounded-3xl shadow-xl space-y-6">
      
      {/* OVERVIEW MODE */}
      {mode === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex items-center gap-3 pb-5 border-b border-slate-800/80">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 text-blue-400 border border-blue-500/30">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Gerenciamento de Senhas</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Crie chaves de acesso para diferentes menus e proteja seu perfil.
              </p>
            </div>
          </div>

          {/* Profile Lock Card */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                {settings.isProfileLocked ? <Lock className="text-blue-400" /> : <Unlock />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Senha do Perfil
                  {settings.isProfileLocked ? (
                    <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">ATIVADO</span>
                  ) : (
                    <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">DESATIVADO</span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Solicita uma senha para acessar as configurações de perfil e gerenciar outras senhas.
                </p>
              </div>
            </div>
            <button 
              onClick={handleOpenProfileEdit}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-colors self-start sm:self-center shrink-0 flex items-center gap-2"
            >
              <Edit2 size={14} />
              Configurar
            </button>
          </div>

          {/* Access Keys Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <KeyRound size={16} className="text-blue-400" />
                Chaves de Acesso
              </h3>
              <button 
                onClick={() => handleOpenKeyEdit()}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Plus size={14} />
                Nova Chave
              </button>
            </div>

            {settings.accessKeys.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-slate-500">
                <KeyRound size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Nenhuma chave de acesso configurada.</p>
                <p className="text-xs mt-1">Crie uma chave para proteger seus menus.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings.accessKeys.map(key => (
                  <div key={key.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-white text-base">{key.name}</h4>
                        <span className="text-[10px] font-mono bg-slate-950 px-2 py-1 rounded-md text-slate-400 border border-slate-800">
                          PIN: {key.pin}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {key.protectedRoutes.map(route => {
                          const menu = ALL_PROTECTABLE_MENUS.find(m => m.id === route);
                          return (
                            <span key={route} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                              {menu?.label || route}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button 
                        onClick={() => deleteAccessKey(key.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Excluir Chave"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleOpenKeyEdit(key)}
                        className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Editar Chave"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT PROFILE LOCK MODE */}
      {mode === 'edit-profile' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="text-blue-400" />
              Configurar Senha do Perfil
            </h2>
            <button onClick={() => setMode('overview')} className="p-2 text-slate-400 hover:text-white rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6 max-w-md">
            <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/50 cursor-pointer hover:bg-slate-900 transition-colors">
              <div className="mt-0.5">
                <input 
                  type="checkbox" 
                  checked={profileLocked} 
                  onChange={(e) => setProfileLocked(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-500 bg-slate-800 border-slate-700 focus:ring-blue-500 focus:ring-offset-slate-900" 
                />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Exigir senha para acessar o Perfil</p>
                <p className="text-xs text-slate-400 mt-1">
                  Se ativado, qualquer pessoa precisará do PIN abaixo para abrir esta tela.
                </p>
              </div>
            </label>

            {profileLocked && (
              <div className="space-y-1.5 animate-in zoom-in-95 duration-200">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                  <Lock size={13} className="text-blue-400" />
                  <span>PIN do Perfil (4 Dígitos)</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={profilePin}
                  onChange={(e) => setProfilePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Ex: 1234"
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all outline-none text-base tracking-widest font-bold"
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-4">
              <button onClick={() => setMode('overview')} className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-colors">
                Cancelar
              </button>
              <button onClick={saveProfileLock} className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-500/20">
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ACCESS KEY MODE */}
      {mode === 'edit-key' && (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <KeyRound className="text-blue-400" />
              {editingKeyId ? 'Editar Chave de Acesso' : 'Nova Chave de Acesso'}
            </h2>
            <button onClick={() => setMode('overview')} className="p-2 text-slate-400 hover:text-white rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                  Nome da Chave
                </label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="Ex: Financeiro"
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all outline-none font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                  <Lock size={13} className="text-blue-400" />
                  <span>PIN (4 Dígitos)</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={keyPin}
                  onChange={(e) => setKeyPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Ex: 1234"
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all outline-none text-base tracking-widest font-bold"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Menus Protegidos
                </label>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {keyRoutes.length === ALL_PROTECTABLE_MENUS.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>
              </div>
              
              <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {ALL_PROTECTABLE_MENUS.map(menu => {
                  const isChecked = keyRoutes.includes(menu.id);
                  return (
                    <div
                      key={menu.id}
                      onClick={() => handleToggleRoute(menu.id)}
                      className={`
                        p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none text-sm
                        ${isChecked
                          ? 'bg-blue-600/15 border-blue-500/60 text-white'
                          : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900/70 hover:text-slate-200'
                        }
                      `}
                    >
                      <span className="font-bold">{menu.label}</span>
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                        isChecked ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700 bg-slate-900'
                      }`}>
                        {isChecked && <CheckCircle2 size={12} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
            <button onClick={() => setMode('overview')} className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-colors">
              Cancelar
            </button>
            <button onClick={saveAccessKey} className="py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
              <Save size={16} />
              Salvar Chave
            </button>
          </div>
        </div>
      )}

      {/* VERIFICATION MODAL */}
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
