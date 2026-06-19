import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { useChecklist, Task } from '@/hooks/useChecklist';
import { toast } from 'sonner';

const frequencyLabels = {
  unica: 'Única',
  diaria: 'Diária',
  semanal: 'Semanal',
  mensal: 'Mensal',
};

export default function Checklist() {
  const { tasks, isLoading, addTask, updateTask, deleteTask, completeTask } = useChecklist();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'unica' as Task['frequency'],
    nextDate: '',
  });

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        name: task.name,
        frequency: task.frequency,
        nextDate: task.nextDate,
      });
    } else {
      setEditingTask(null);
      setFormData({ name: '', frequency: 'unica', nextDate: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nextDate) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      if (editingTask) {
        await updateTask(editingTask.id, formData);
        toast.success("Tarefa atualizada com sucesso.");
      } else {
        await addTask(formData);
        toast.success("Tarefa criada com sucesso.");
      }
      setIsDialogOpen(false);
    } catch (err) {
      toast.error("Erro ao salvar tarefa.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTask(id);
      toast.success("Tarefa excluída com sucesso.");
    } catch (err) {
      toast.error("Erro ao excluir tarefa.");
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await completeTask(id);
      toast.success("Tarefa concluída!");
    } catch (err) {
      toast.error("Erro ao concluir tarefa.");
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in font-sans text-slate-100 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="page-header mb-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">Checklist</h1>
            <p className="text-slate-400 text-sm">Gerencie suas tarefas recorrentes</p>
          </div>
          <button
            onClick={() => handleOpenDialog()}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3 rounded-full font-bold active:scale-95 transition-all shadow-lg shadow-blue-600/15"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Tarefa
          </button>
        </div>

        {/* Tasks List */}
        <div className="glass-panel rounded-[28px] overflow-hidden border border-slate-900/50 shadow-xl">
          <div className="p-8 border-b border-slate-900/60 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Tarefas</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/20 text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 border-b border-slate-900/60">
                  <th className="px-8 py-5">Tarefa</th>
                  <th className="px-8 py-5">Frequência</th>
                  <th className="px-8 py-5">Próxima Data</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-slate-500 italic">
                      Nenhuma tarefa cadastrada ainda.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-900/20 transition-colors group">
                      <td className="px-8 py-6 font-bold text-white">{task.name}</td>
                      <td className="px-8 py-6 text-slate-400 font-medium">{frequencyLabels[task.frequency]}</td>
                      <td className="px-8 py-6 text-slate-400 font-medium">{formatDate(task.nextDate)}</td>
                      <td className="px-8 py-6">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {task.status !== 'completed' && (
                            <button
                              onClick={() => handleComplete(task.id)}
                              className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl transition-all"
                              title="Marcar como Concluída"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDialog(task)}
                            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsDialogOpen(false)}></div>
          <div className="relative glass-panel w-full max-w-md rounded-[28px] border border-slate-900/50 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500 font-sans p-0">
            <div className="p-8 border-b border-slate-900/60 flex justify-between items-start">
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
                </h2>
                <p className="text-slate-400 font-medium">Preencha os dados da tarefa abaixo.</p>
              </div>
              <button onClick={() => setIsDialogOpen(false)} className="text-slate-400 hover:text-white p-2 rounded-2xl hover:bg-slate-800 transition-all">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nome da tarefa</Label>
                <input
                  id="name"
                  required
                  type="text"
                  className="w-full px-5 py-3.5 bg-slate-900/60 border border-slate-800 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl focus:outline-none transition-all font-medium"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Fechar caixa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency" className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Frequência</Label>
                <div className="relative">
                  <select
                    id="frequency"
                    className="w-full appearance-none px-5 py-3.5 bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl focus:outline-none transition-all cursor-pointer"
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as Task['frequency'] })}
                  >
                    <option value="unica" className="bg-slate-950 text-white">Única</option>
                    <option value="diaria" className="bg-slate-950 text-white">Diária</option>
                    <option value="semanal" className="bg-slate-950 text-white">Semanal</option>
                    <option value="mensal" className="bg-slate-950 text-white">Mensal</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextDate" className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Próxima data</Label>
                <input
                  id="nextDate"
                  required
                  type="date"
                  className="w-full px-5 py-3.5 bg-slate-900/60 border border-slate-800 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl focus:outline-none transition-all font-medium"
                  value={formData.nextDate}
                  onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 py-4 bg-slate-900 border border-slate-800 text-slate-300 font-semibold rounded-2xl hover:bg-slate-800 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-[1.5] py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
