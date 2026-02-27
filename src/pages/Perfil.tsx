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

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(
        { name: formData.name, email: formData.email },
        { razaoSocial: formData.razaoSocial, cnpj: formData.cnpj }
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
      <div className="animate-fade-in flex flex-col items-center">
        <div className="w-full max-w-3xl">
          {/* Header da Página */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Perfil</h1>
            <p className="text-slate-500 mt-1">Gerencie seus dados pessoais e da empresa com segurança.</p>
          </header>

          <div className="space-y-6">
            {/* Card: Dados do Usuário */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <User size={20} />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-700">Dados do Usuário</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 ml-1">Nome</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Seu nome completo"
                        className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 ml-1">E-mail</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@exemplo.com"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Card: Dados da Empresa */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Building2 size={20} />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-700">Dados da Empresa</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 ml-1">Razão Social</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.razaoSocial}
                        onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                        placeholder="Nome da empresa"
                        className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 ml-1">CNPJ</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <FileText size={18} />
                      </div>
                      <input
                        type="text"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                        placeholder="00.000.000/0001-00"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Ações de Formulário */}
            <div className="flex items-center justify-end gap-4 pt-4">
              {showSuccess && (
                <span className="flex items-center gap-2 text-emerald-600 font-medium animate-in fade-in slide-in-from-right-4">
                  <CheckCircle2 size={18} />
                  Alterações salvas!
                </span>
              )}

              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-[#1e293b] hover:bg-[#0f172a] text-white px-8 py-3.5 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
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

