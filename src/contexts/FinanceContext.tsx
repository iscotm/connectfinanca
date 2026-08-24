import React, { createContext, useContext, ReactNode, useMemo, useCallback, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export interface Expense {
  id: number;
  name: string;
  value: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface Boleto {
  id: number;
  name: string;
  value: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface PaymentFees {
  pix: number;
  debit: number;
  credit: number;
}

export interface FundoWithdrawal {
  id: string;
  amount: number;
  obs: string;
  date: string;
}

export interface DREConfig {
  bancoDespesas: string;
  bancoCMV: string;
  bancoFundo: string;
  bancoSobras: string;
  totalDiasMes: number;
  diaAtual: number;
  despesasRestantes: number;
  metaDiariaFundo: number;
  percentualCMV: number;
  paymentFees?: PaymentFees;
  withdrawals?: FundoWithdrawal[];
  startDate?: string;
  endDate?: string;
  prioridadeCMV_DRE?: boolean;
  incluirFDC?: boolean;
}

export interface DailySalesEntry {
  day: number;
  month: number;
  year: number;
  dinheiro: number;
  pix: number;
  debito: number;
  credito: number;
  totalLiquido: number;
  status: 'pending' | 'processed' | 'future';
}

interface FinanceContextType {
  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: number, expense: Partial<Expense>) => void;
  deleteExpense: (id: number) => void;
  markExpenseAsPaid: (id: number) => void;

  // Boletos
  boletos: Boleto[];
  addBoleto: (boleto: Omit<Boleto, 'id'>) => void;
  updateBoleto: (id: number, boleto: Partial<Boleto>) => void;
  deleteBoleto: (id: number) => void;
  markBoletoAsPaid: (id: number) => void;

  // Daily Sales
  dailySales: DailySalesEntry[];
  addOrUpdateDailySale: (sale: Omit<DailySalesEntry, 'status'> & { status?: DailySalesEntry['status'] }) => void;
  getDailySale: (day: number, month: number, year: number) => DailySalesEntry | undefined;

  // DRE Config
  dreConfig: DREConfig;
  updateDREConfig: (config: Partial<DREConfig>) => void;
  getDREConfigForMonth: (month: number, year: number) => DREConfig;
  updateDREConfigForMonth: (month: number, year: number, config: Partial<DREConfig>) => Promise<void>;
  getDiasRestantesForMonth: (config: DREConfig) => number;
  getRateioDiarioDespesasForMonth: (config: DREConfig) => number;

  paymentFees: PaymentFees;
  updatePaymentFees: (fees: Partial<PaymentFees>) => void;

  // Fundo de Caixa Withdrawals
  addFundoWithdrawal: (month: number, year: number, withdrawal: Omit<FundoWithdrawal, 'id'>) => Promise<void>;
  deleteFundoWithdrawal: (month: number, year: number, id: string) => Promise<void>;

  // Calculated values
  despesasRestantes: number;
  rateioDiarioDespesas: number;
  diasRestantes: number;

  // Utilities
  resetAllData: () => void;
  isLoading: boolean;

  // Totals
  totalExpensesPending: number;
  totalBoletosPending: number;
  totalSalesMonth: number;
}

const banks = [
  'Banco do Brasil',
  'Itaú',
  'Bradesco',
  'Santander',
  'Caixa Econômica',
  'Nubank',
  'Inter',
  'C6 Bank',
];

const initialDREConfig: DREConfig = {
  bancoDespesas: '',
  bancoCMV: '',
  bancoFundo: '',
  bancoSobras: '',
  totalDiasMes: 0,
  diaAtual: 0,
  despesasRestantes: 0,
  metaDiariaFundo: 0,
  percentualCMV: 0,
  prioridadeCMV_DRE: false,
  incluirFDC: false,
};

// Configuração padrão mínima para evitar divisões por zero ou flashes estranhos
const fallbackDREConfig: DREConfig = {
  ...initialDREConfig,
  totalDiasMes: 30,
  diaAtual: 1,
};

const initialPaymentFees: PaymentFees = {
  pix: 0,
  debit: 1.01,
  credit: 3.13,
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  // State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [dreConfig, setDREConfig] = useState<DREConfig>(initialDREConfig);
  const [monthlyConfigs, setMonthlyConfigs] = useState<Record<string, DREConfig>>({});
  const [paymentFees, setPaymentFees] = useState<PaymentFees>(initialPaymentFees);
  const [dailySales, setDailySales] = useState<DailySalesEntry[]>([]);

  // Totals / Calculated from state
  const totalExpensesPending = useMemo(() => {
    return expenses
      .filter(e => e.status === 'pending' || e.status === 'overdue')
      .reduce((sum, e) => sum + e.value, 0);
  }, [expenses]);

  // Helper to check if date is past due
  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = dueDate.split('-').map(Number);
    const due = new Date(year, month - 1, day);

    return due < today;
  };

  // Load data from Supabase when user changes
  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setBoletos([]);
      setDailySales([]);
      setDREConfig(initialDREConfig);
      setMonthlyConfigs({});
      setPaymentFees(initialPaymentFees);
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      console.log('FinanceContext: Loading data for user', user.id);

      try {
        // Load all data in parallel but handle failures individually
        const [
          expensesRes,
          boletosRes,
          salesRes,
          dreRes,
          feesRes
        ] = await Promise.allSettled([
          supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('boletos').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('daily_sales').select('*').eq('user_id', user.id),
          supabase.from('dre_config').select('*').eq('user_id', user.id).single(),
          supabase.from('payment_fees').select('*').eq('user_id', user.id).single()
        ]);

        // Expenses
        if (expensesRes.status === 'fulfilled' && !expensesRes.value.error && expensesRes.value.data) {
          setExpenses(expensesRes.value.data.map(e => ({
            id: e.id,
            name: e.name,
            value: parseFloat(e.value),
            dueDate: e.due_date,
            status: e.status === 'paid' ? 'paid' : (isOverdue(e.due_date) ? 'overdue' : 'pending'),
          })));
        }

        // Boletos
        if (boletosRes.status === 'fulfilled' && !boletosRes.value.error && boletosRes.value.data) {
          setBoletos(boletosRes.value.data.map(b => ({
            id: b.id,
            name: b.name,
            value: parseFloat(b.value),
            dueDate: b.due_date,
            status: b.status === 'paid' ? 'paid' : (isOverdue(b.due_date) ? 'overdue' : 'pending'),
          })));
        }

        // Daily Sales
        if (salesRes.status === 'fulfilled' && !salesRes.value.error && salesRes.value.data) {
          setDailySales(salesRes.value.data.map(s => ({
            day: Number(s.day),
            month: Number(s.month),
            year: Number(s.year),
            dinheiro: parseFloat(s.dinheiro),
            pix: parseFloat(s.pix),
            debito: parseFloat(s.debito),
            credito: parseFloat(s.credito),
            totalLiquido: parseFloat(s.total_liquido),
            status: s.status as 'pending' | 'processed' | 'future',
          })));
        }

        // DRE Config
        if (dreRes.status === 'fulfilled' && !dreRes.value.error && dreRes.value.data) {
          const d = dreRes.value.data;
          let parsedMonthly: Record<string, DREConfig> = {};
          if (d.banco_despesas && d.banco_despesas.startsWith('{')) {
            try {
              const parsed = JSON.parse(d.banco_despesas);
              if (parsed && parsed.monthly) {
                parsedMonthly = parsed.monthly;
              }
            } catch (e) {
              console.error('Failed to parse monthly configs', e);
            }
          }

          setMonthlyConfigs(parsedMonthly);

          const now = new Date();
          const currentKey = `${now.getFullYear()}-${now.getMonth()}`;
          const currentMonthlyConfig = parsedMonthly[currentKey];

          const firstDayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const lastDayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

          const loadedConfig: DREConfig = {
            bancoDespesas: d.banco_despesas || '',
            bancoCMV: d.banco_cmv || '',
            bancoFundo: d.banco_fundo || '',
            bancoSobras: d.banco_sobras || '',
            totalDiasMes: d.total_dias_mes || 0,
            diaAtual: d.dia_atual || 0,
            despesasRestantes: parseFloat(d.despesas_restantes) || 0,
            metaDiariaFundo: parseFloat(d.meta_diaria_fundo) || 0,
            percentualCMV: parseFloat(d.percentual_cmv) || 0,
            withdrawals: parsedMonthly.withdrawals || [],
            startDate: currentMonthlyConfig?.startDate || firstDayStr,
            endDate: currentMonthlyConfig?.endDate || lastDayStr,
            prioridadeCMV_DRE: currentMonthlyConfig?.prioridadeCMV_DRE || false,
            incluirFDC: currentMonthlyConfig?.incluirFDC || false,
          };

          if (loadedConfig.startDate && loadedConfig.endDate) {
            const start = new Date(loadedConfig.startDate + 'T00:00:00');
            const end = new Date(loadedConfig.endDate + 'T00:00:00');
            const diffTime = Math.abs(end.getTime() - start.getTime());
            loadedConfig.totalDiasMes = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (today < start) {
              loadedConfig.diaAtual = 1;
            } else if (today > end) {
              loadedConfig.diaAtual = loadedConfig.totalDiasMes + 1;
            } else {
              const diffToday = Math.abs(today.getTime() - start.getTime());
              loadedConfig.diaAtual = Math.ceil(diffToday / (1000 * 60 * 60 * 24)) + 1;
            }
          }

          setDREConfig(loadedConfig);
        }

        // Payment Fees
        if (feesRes.status === 'fulfilled' && !feesRes.value.error && feesRes.value.data) {
          const f = feesRes.value.data;
          setPaymentFees({
            pix: parseFloat(f.pix) || 0,
            debit: parseFloat(f.debit) || 1.01,
            credit: parseFloat(f.credit) || 3.13,
          });
        }

      } catch (error) {
        console.error('Critical error loading finance data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // === EXPENSES ===
  const addExpense = useCallback(async (expense: Omit<Expense, 'id'>) => {
    if (!user) return;

    const finalStatus = expense.status === 'paid' ? 'paid' : (isOverdue(expense.dueDate) ? 'overdue' : 'pending');

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        name: expense.name,
        value: expense.value,
        due_date: expense.dueDate,
        status: finalStatus,
      })
      .select()
      .single();

    if (!error && data) {
      setExpenses(prev => [{
        id: data.id,
        name: data.name,
        value: parseFloat(data.value),
        dueDate: data.due_date,
        status: data.status as 'paid' | 'pending' | 'overdue',
      }, ...prev]);
    }
  }, [user, isOverdue]);

  const updateExpense = useCallback(async (id: number, expenseData: Partial<Expense>) => {
    if (!user) return;

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (expenseData.name !== undefined) updateData.name = expenseData.name;
    if (expenseData.value !== undefined) updateData.value = expenseData.value;
    if (expenseData.dueDate !== undefined) updateData.due_date = expenseData.dueDate;
    if (expenseData.status !== undefined) updateData.status = expenseData.status;

    // Auto-calculate overdue if status is not paid
    const current = expenses.find(e => e.id === id);
    const newStatus = expenseData.status || current?.status;
    const newDueDate = expenseData.dueDate || current?.dueDate;
    if (newStatus !== 'paid' && newDueDate) {
      const calculatedStatus = isOverdue(newDueDate) ? 'overdue' : 'pending';
      updateData.status = calculatedStatus;
      expenseData.status = calculatedStatus;
    }

    const { error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setExpenses(prev => prev.map(e =>
        e.id === id ? { ...e, ...expenseData } : e
      ));
    }
  }, [user, expenses, isOverdue]);

  const deleteExpense = useCallback(async (id: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  }, [user]);

  const markExpenseAsPaid = useCallback(async (id: number) => {
    await updateExpense(id, { status: 'paid' });
  }, [updateExpense]);

  // === BOLETOS ===
  const addBoleto = useCallback(async (boleto: Omit<Boleto, 'id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('boletos')
      .insert({
        user_id: user.id,
        name: boleto.name,
        value: boleto.value,
        due_date: boleto.dueDate,
        status: boleto.status,
      })
      .select()
      .single();

    if (!error && data) {
      setBoletos(prev => [{
        id: data.id,
        name: data.name,
        value: parseFloat(data.value),
        dueDate: data.due_date,
        status: data.status as 'paid' | 'pending' | 'overdue',
      }, ...prev]);
    }
  }, [user]);

  const updateBoleto = useCallback(async (id: number, boletoData: Partial<Boleto>) => {
    if (!user) return;

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (boletoData.name !== undefined) updateData.name = boletoData.name;
    if (boletoData.value !== undefined) updateData.value = boletoData.value;
    if (boletoData.dueDate !== undefined) updateData.due_date = boletoData.dueDate;
    if (boletoData.status !== undefined) updateData.status = boletoData.status;

    const { error } = await supabase
      .from('boletos')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setBoletos(prev => prev.map(b =>
        b.id === id ? { ...b, ...boletoData } : b
      ));
    }
  }, [user]);

  const deleteBoleto = useCallback(async (id: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('boletos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setBoletos(prev => prev.filter(b => b.id !== id));
    }
  }, [user]);

  const markBoletoAsPaid = useCallback(async (id: number) => {
    await updateBoleto(id, { status: 'paid' });
  }, [updateBoleto]);

  // === DAILY SALES ===
  const addOrUpdateDailySale = useCallback(async (sale: Omit<DailySalesEntry, 'status'> & { status?: DailySalesEntry['status'] }) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      // Usar UPSERT do Supabase para garantir atomicidade e evitar o erro de registro ausente
      // Nota: Para o upsert funcionar por data, a tabela precisa ter um constraint único em (user_id, day, month, year)
      // Caso não tenha, vamos manter a lógica de busca manual mas com tratamento de erro melhorado.
      
      const { data: existing } = await supabase
        .from('daily_sales')
        .select('id')
        .eq('user_id', user.id)
        .eq('day', sale.day)
        .eq('month', sale.month)
        .eq('year', sale.year)
        .maybeSingle();

      let error;
      
      if (existing) {
        const { error: updateError } = await supabase
          .from('daily_sales')
          .update({
            dinheiro: sale.dinheiro,
            pix: sale.pix,
            debito: sale.debito,
            credito: sale.credito,
            total_liquido: sale.totalLiquido,
            status: sale.status || 'processed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('daily_sales')
          .insert({
            user_id: user.id,
            day: sale.day,
            month: sale.month,
            year: sale.year,
            dinheiro: sale.dinheiro,
            pix: sale.pix,
            debito: sale.debito,
            credito: sale.credito,
            total_liquido: sale.totalLiquido,
            status: sale.status || 'processed',
          });
        error = insertError;
      }

      if (error) {
        console.error('Erro ao salvar venda:', error);
        toast.error('Erro ao salvar no Supabase: ' + (error.message || 'Erro desconhecido'));
        return;
      }

      // Atualiza estado local de forma imutável e atômica
      setDailySales(prev => {
        const newSale: DailySalesEntry = {
          ...sale,
          status: sale.status || 'processed',
        };

        const existingIndex = prev.findIndex(
          s => s.day === sale.day && s.month === sale.month && s.year === sale.year
        );

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newSale;
          return updated;
        }

        return [...prev, newSale];
      });

      toast.success('Venda salva com sucesso!');
    } catch (err: any) {
      console.error('Erro inesperado no addOrUpdateDailySale:', err);
      toast.error('Erro inesperado ao salvar: ' + (err.message || 'Erro desconhecido'));
    }
  }, [user]);

  const getExpensesPendingInRange = useCallback((start?: string, end?: string) => {
    return expenses
      .filter(e => {
        const isPending = e.status === 'pending' || e.status === 'overdue';
        if (!isPending) return false;
        if (start && end) {
          return e.dueDate >= start && e.dueDate <= end;
        }
        return true;
      })
      .reduce((sum, e) => sum + e.value, 0);
  }, [expenses]);

  const getTotalExpensesForMonth = useCallback((month: number, year: number) => {
    return expenses
      .filter(e => {
        if (!e.dueDate) return false;
        const [y, m, _] = e.dueDate.split('-').map(Number);
        return y === year && (m - 1) === month;
      })
      .reduce((sum, e) => sum + e.value, 0);
  }, [expenses]);

  const getDailySale = useCallback((day: number, month: number, year: number) => {
    return dailySales.find(s => s.day === day && s.month === month && s.year === year);
  }, [dailySales]);

  // === CONFIG UPDATES ===
  const getDREConfigForMonth = useCallback((month: number, year: number): DREConfig => {
    const key = `${year}-${month}`;
    const monthlyConfig = monthlyConfigs[key];
    
    // Set default start/end dates if not present
    const firstDayStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const lastDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    let baseConfig: DREConfig;
    
    const start = monthlyConfig?.startDate || dreConfig.startDate || firstDayStr;
    const end = monthlyConfig?.endDate || dreConfig.endDate || lastDayStr;
    const totalExpensesMonth = getTotalExpensesForMonth(month, year);

    if (monthlyConfig) {
      baseConfig = {
        ...monthlyConfig,
        paymentFees: monthlyConfig.paymentFees || paymentFees,
        withdrawals: monthlyConfig.withdrawals || [],
        startDate: start,
        endDate: end,
        despesasRestantes: (typeof monthlyConfig.despesasRestantes === 'number' && monthlyConfig.despesasRestantes !== 0)
          ? monthlyConfig.despesasRestantes
          : totalExpensesMonth,
        prioridadeCMV_DRE: monthlyConfig.prioridadeCMV_DRE || false,
        incluirFDC: monthlyConfig.incluirFDC || false,
      };
    } else {
      const fallbackBancoDespesas = (dreConfig.bancoDespesas && dreConfig.bancoDespesas.startsWith('{')) 
        ? '' 
        : dreConfig.bancoDespesas;
        
      baseConfig = {
        bancoDespesas: fallbackBancoDespesas || '',
        bancoCMV: dreConfig.bancoCMV || '',
        bancoFundo: dreConfig.bancoFundo || '',
        bancoSobras: dreConfig.bancoSobras || '',
        totalDiasMes: dreConfig.totalDiasMes || 30,
        diaAtual: dreConfig.diaAtual || 1,
        despesasRestantes: (typeof dreConfig.despesasRestantes === 'number' && dreConfig.despesasRestantes !== 0)
          ? dreConfig.despesasRestantes
          : totalExpensesMonth,
        metaDiariaFundo: dreConfig.metaDiariaFundo || 0,
        percentualCMV: dreConfig.percentualCMV || 0,
        paymentFees,
        withdrawals: dreConfig.withdrawals || [],
        startDate: start,
        endDate: end,
        prioridadeCMV_DRE: dreConfig.prioridadeCMV_DRE || false,
        incluirFDC: dreConfig.incluirFDC || false,
      };
    }

    // Dynamic calculations for days
    if (baseConfig.startDate && baseConfig.endDate) {
      const startD = new Date(baseConfig.startDate + 'T00:00:00');
      const endD = new Date(baseConfig.endDate + 'T00:00:00');
      const diffTime = Math.abs(endD.getTime() - startD.getTime());
      baseConfig.totalDiasMes = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (today < startD) {
        baseConfig.diaAtual = 1;
      } else if (today > endD) {
        baseConfig.diaAtual = baseConfig.totalDiasMes + 1;
      } else {
        const diffToday = Math.abs(today.getTime() - startD.getTime());
        baseConfig.diaAtual = Math.ceil(diffToday / (1000 * 60 * 60 * 24)) + 1;
      }
    }

    return baseConfig;
  }, [monthlyConfigs, dreConfig, paymentFees, getTotalExpensesForMonth]);

  const updateDREConfigForMonth = useCallback(async (month: number, year: number, config: Partial<DREConfig>) => {
    if (!user) return;

    const key = `${year}-${month}`;
    const currentConfig = getDREConfigForMonth(month, year);
    
    const newConfig = { 
      ...currentConfig, 
      ...config,
    };
    if (newConfig.despesasRestantes === undefined || newConfig.despesasRestantes === 0) {
      newConfig.despesasRestantes = totalExpensesMonth;
    }

    // Re-calculate totalDiasMes and diaAtual based on new startDate/endDate
    if (newConfig.startDate && newConfig.endDate) {
      const startD = new Date(newConfig.startDate + 'T00:00:00');
      const endD = new Date(newConfig.endDate + 'T00:00:00');
      const diffTime = Math.abs(endD.getTime() - startD.getTime());
      newConfig.totalDiasMes = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (today < startD) {
        newConfig.diaAtual = 1;
      } else if (today > endD) {
        newConfig.diaAtual = newConfig.totalDiasMes + 1;
      } else {
        const diffToday = Math.abs(today.getTime() - startD.getTime());
        newConfig.diaAtual = Math.ceil(diffToday / (1000 * 60 * 60 * 24)) + 1;
      }
    }

    const updatedMonthlyConfigs = {
      ...monthlyConfigs,
      [key]: newConfig
    };

    setMonthlyConfigs(updatedMonthlyConfigs);

    const dbData = {
      user_id: user.id,
      banco_despesas: JSON.stringify({ monthly: updatedMonthlyConfigs }),
      banco_cmv: newConfig.bancoCMV,
      banco_fundo: newConfig.bancoFundo,
      banco_sobras: newConfig.bancoSobras,
      total_dias_mes: newConfig.totalDiasMes,
      dia_atual: newConfig.diaAtual,
      despesas_restantes: newConfig.despesasRestantes,
      meta_diaria_fundo: newConfig.metaDiariaFundo,
      percentual_cmv: newConfig.percentualCMV,
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from('dre_config')
      .upsert(dbData, { onConflict: 'user_id' });

    setDREConfig(newConfig);
  }, [user, monthlyConfigs, getDREConfigForMonth, getTotalExpensesForMonth]);

  const updateDREConfig = useCallback(async (config: Partial<DREConfig>) => {
    // Para retrocompatibilidade, atualiza o mês atual
    const now = new Date();
    await updateDREConfigForMonth(now.getMonth(), now.getFullYear(), config);
  }, [updateDREConfigForMonth]);

  const getDiasRestantesForMonth = useCallback((config: DREConfig) => {
    if (config.startDate && config.endDate) {
      const startD = new Date(config.startDate + 'T00:00:00');
      const endD = new Date(config.endDate + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (today > endD) return Math.ceil(Math.abs(endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const referenceDate = today < startD ? startD : today;
      const diffTime = Math.max(0, endD.getTime() - referenceDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    return Math.max(0, config.totalDiasMes - config.diaAtual + 1);
  }, []);

  const getRateioDiarioDespesasForMonth = useCallback((config: DREConfig) => {
    let month = new Date().getMonth();
    let year = new Date().getFullYear();
    if (config.startDate) {
      const parts = config.startDate.split('-');
      if (parts.length >= 2) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
      }
    }
    const desp = (config.despesasRestantes !== undefined && config.despesasRestantes !== 0)
      ? config.despesasRestantes
      : getTotalExpensesForMonth(month, year);
    return config.totalDiasMes > 0 ? desp / config.totalDiasMes : 0;
  }, [getTotalExpensesForMonth]);

  const updatePaymentFees = useCallback(async (fees: Partial<PaymentFees>) => {
    if (!user) return;

    const newFees = { ...paymentFees, ...fees };
    setPaymentFees(newFees);

    const dbData = {
      user_id: user.id,
      pix: newFees.pix,
      debit: newFees.debit,
      credit: newFees.credit,
      updated_at: new Date().toISOString(),
    };

    // Upsert
    await supabase
      .from('payment_fees')
      .upsert(dbData, { onConflict: 'user_id' });
  }, [user, paymentFees]);

  const addFundoWithdrawal = useCallback(async (month: number, year: number, withdrawal: Omit<FundoWithdrawal, 'id'>) => {
    const config = getDREConfigForMonth(month, year);
    const newWithdrawal: FundoWithdrawal = {
      ...withdrawal,
      id: crypto.randomUUID()
    };
    const withdrawals = [...(config.withdrawals || []), newWithdrawal];
    await updateDREConfigForMonth(month, year, { withdrawals });
  }, [getDREConfigForMonth, updateDREConfigForMonth]);

  const deleteFundoWithdrawal = useCallback(async (month: number, year: number, id: string) => {
    const config = getDREConfigForMonth(month, year);
    const withdrawals = (config.withdrawals || []).filter(w => w.id !== id);
    await updateDREConfigForMonth(month, year, { withdrawals });
  }, [getDREConfigForMonth, updateDREConfigForMonth]);

  const resetAllData = useCallback(async () => {
    if (!user) return;

    // Delete all user data from Supabase
    await Promise.all([
      supabase.from('expenses').delete().eq('user_id', user.id),
      supabase.from('boletos').delete().eq('user_id', user.id),
      supabase.from('daily_sales').delete().eq('user_id', user.id),
      supabase.from('dre_config').delete().eq('user_id', user.id),
      supabase.from('payment_fees').delete().eq('user_id', user.id),
    ]);

    setExpenses([]);
    setBoletos([]);
    setDailySales([]);
    setDREConfig(initialDREConfig);
    setPaymentFees(initialPaymentFees);
  }, [user]);

  // === CALCULATED VALUES ===
  const despesasRestantes = useMemo(() => {
    if (dreConfig.despesasRestantes !== undefined && dreConfig.despesasRestantes !== 0) {
      return dreConfig.despesasRestantes;
    }
    let month = new Date().getMonth();
    let year = new Date().getFullYear();
    if (dreConfig.startDate) {
      const parts = dreConfig.startDate.split('-');
      if (parts.length >= 2) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
      }
    }
    return getTotalExpensesForMonth(month, year);
  }, [dreConfig.despesasRestantes, getTotalExpensesForMonth, dreConfig.startDate]);

  const diasRestantes = useMemo(() => {
    if (dreConfig.startDate && dreConfig.endDate) {
      const start = new Date(dreConfig.startDate + 'T00:00:00');
      const end = new Date(dreConfig.endDate + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (today > end) return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const referenceDate = today < start ? start : today;
      const diffTime = Math.max(0, end.getTime() - referenceDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    // Inclusive: including today
    return Math.max(0, dreConfig.totalDiasMes - dreConfig.diaAtual + 1);
  }, [dreConfig.totalDiasMes, dreConfig.diaAtual, dreConfig.startDate, dreConfig.endDate]);

  const rateioDiarioDespesas = useMemo(() => {
    return dreConfig.totalDiasMes > 0 ? despesasRestantes / dreConfig.totalDiasMes : 0;
  }, [despesasRestantes, dreConfig.totalDiasMes]);



  const totalBoletosPending = useMemo(() => {
    return boletos
      .filter(b => b.status === 'pending' || b.status === 'overdue')
      .reduce((sum, b) => sum + b.value, 0);
  }, [boletos]);

  const totalSalesMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return dailySales
      .filter(s => s.month === currentMonth && s.year === currentYear)
      .reduce((sum, s) => sum + s.totalLiquido, 0);
  }, [dailySales]);

  const value: FinanceContextType = {
    // Expenses
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    markExpenseAsPaid,
    // Boletos
    boletos,
    addBoleto,
    updateBoleto,
    deleteBoleto,
    markBoletoAsPaid,
    // Daily Sales
    dailySales,
    addOrUpdateDailySale,
    getDailySale,
    // Config
    dreConfig,
    updateDREConfig,
    getDREConfigForMonth,
    updateDREConfigForMonth,
    getDiasRestantesForMonth,
    getRateioDiarioDespesasForMonth,
    paymentFees,
    updatePaymentFees,
    addFundoWithdrawal,
    deleteFundoWithdrawal,
    // Calculated
    despesasRestantes,
    rateioDiarioDespesas,
    diasRestantes,

    // Utilities
    resetAllData,
    isLoading,
    // Totals
    totalExpensesPending,
    totalBoletosPending,
    totalSalesMonth,
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}

export { banks };
