import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, ShieldAlert, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select(`
          id, 
          action, 
          description, 
          created_at,
          admin_id,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Erro ao buscar logs do sistema');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Logs do Sistema</h1>
          <p className="text-slate-400">Auditoria e histórico de ações administrativas.</p>
        </div>
      </header>

      <div className="glass-panel rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
        <div className="space-y-4">
          {isLoading ? (
             <div className="text-center py-8 text-slate-500">Carregando histórico...</div>
          ) : logs.length === 0 ? (
             <div className="text-center py-12 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500 mb-4">
                  <Activity size={24} />
                </div>
                <p className="text-slate-400 text-sm">Nenhum log registrado ainda.</p>
             </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-800/60 hover:bg-slate-800/50 transition-colors">
                <div className="mt-1 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  {log.action.includes('UPDATE') ? <Activity size={14} /> : <ShieldAlert size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-200 text-sm">{log.action}</p>
                  <p className="text-slate-400 text-sm mt-0.5">{log.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                     <span>{new Date(log.created_at).toLocaleDateString('pt-BR')} às {new Date(log.created_at).toLocaleTimeString('pt-BR')}</span>
                     <span>•</span>
                     <span className="flex items-center gap-1 font-mono bg-slate-900 px-1.5 py-0.5 rounded">
                       Admin <ArrowRight size={10} /> User ID: {log.user_id?.substring(0, 8)}...
                     </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
