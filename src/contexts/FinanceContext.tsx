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

  // Payment Fees
  paymentFees: PaymentFees;
  updatePaymentFees: (fees: Partial<PaymentFees>) => void;

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
  const [paymentFees, setPaymentFees] = useState<PaymentFees>(initialPaymentFees);
  const [dailySales, setDailySales] = useState<DailySalesEntry[]>([]);

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
          setDREConfig({
            bancoDespesas: d.banco_despesas || '',
            bancoCMV: d.banco_cmv || '',
            bancoFundo: d.banco_fundo || '',
            bancoSobras: d.banco_sobras || '',
            totalDiasMes: d.total_dias_mes || 0,
            diaAtual: d.dia_atual || 0,
            despesasRestantes: parseFloat(d.despesas_restantes) || 0,
            metaDiariaFundo: parseFloat(d.meta_diaria_fundo) || 0,
            percentualCMV: parseFloat(d.percentual_cmv) || 0,
          });
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

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        name: expense.name,
        value: expense.value,
        due_date: expense.dueDate,
        status: expense.status,
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
  }, [user]);

  const updateExpense = useCallback(async (id: number, expenseData: Partial<Expense>) => {
    if (!user) return;

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (expenseData.name !== undefined) updateData.name = expenseData.name;
    if (expenseData.value !== undefined) updateData.value = expenseData.value;
    if (expenseData.dueDate !== undefined) updateData.due_date = expenseData.dueDate;
    if (expenseData.status !== undefined) updateData.status = expenseData.status;

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
  }, [user]);

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

  const getDailySale = useCallback((day: number, month: number, year: number) => {
    return dailySales.find(s => s.day === day && s.month === month && s.year === year);
  }, [dailySales]);

  // === CONFIG UPDATES ===
  const updateDREConfig = useCallback(async (config: Partial<DREConfig>) => {
    if (!user) return;

    const newConfig = { ...dreConfig, ...config };
    setDREConfig(newConfig);

    const dbData = {
      user_id: user.id,
      banco_despesas: newConfig.bancoDespesas,
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

    // Upsert
    await supabase
      .from('dre_config')
      .upsert(dbData, { onConflict: 'user_id' });
  }, [user, dreConfig]);

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
  const despesasRestantes = dreConfig.despesasRestantes;

  const diasRestantes = useMemo(() => {
    // Inclusive: including today
    return Math.max(0, dreConfig.totalDiasMes - dreConfig.diaAtual + 1);
  }, [dreConfig.totalDiasMes, dreConfig.diaAtual]);

  const rateioDiarioDespesas = useMemo(() => {
    if (diasRestantes <= 0) {
      // Fallback para cálculo simples se não houver dias restantes no mês configurado
      return dreConfig.totalDiasMes > 0 ? dreConfig.despesasRestantes / dreConfig.totalDiasMes : 0;
    }
    return despesasRestantes / diasRestantes;
  }, [despesasRestantes, diasRestantes, dreConfig.totalDiasMes, dreConfig.despesasRestantes]);

  // Totals
  const totalExpensesPending = useMemo(() => {
    return expenses
      .filter(e => e.status === 'pending' || e.status === 'overdue')
      .reduce((sum, e) => sum + e.value, 0);
  }, [expenses]);

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
    paymentFees,
    updatePaymentFees,
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
