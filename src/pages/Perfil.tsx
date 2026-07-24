import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { User, Building2, Save, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Perfil() {
  const { user, company, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

  return (
    <MainLayout>
      <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 font-sans text-slate-100 pb-12">
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
          {/* Header da Página */}
          <header className="mb-8 border-b border-slate-900 pb-6 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-lg text-white">
              <User size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Perfil</h1>
              <p className="text-slate-400 text-sm mt-0.5">Gerencie seus dados pessoais e da empresa com segurança.</p>
            </div>
          </header>
 
          <div className="space-y-6">
            {/* Card: Dados do Usuário */}
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
 
            {/* Card: Dados da Empresa */}
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
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/10 outline-none"
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
    </MainLayout>
  );
}
