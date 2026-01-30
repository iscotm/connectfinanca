import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Purchase {
    id: number;
    location: string;
    value: number;
    date: string;
    notes: string;
}

export function usePurchases() {
    const { user } = useAuth();
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load purchases
    useEffect(() => {
        if (!user) {
            setPurchases([]);
            setIsLoading(false);
            return;
        }

        const loadPurchases = async () => {
            setIsLoading(true);
            try {
                const { data } = await supabase
                    .from('purchases')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (data) {
                    setPurchases(data.map(p => ({
                        id: p.id,
                        location: p.location,
                        value: parseFloat(p.value),
                        date: p.date,
                        notes: p.notes || '',
                    })));
                }
            } catch (error) {
                console.error('Error loading purchases:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadPurchases();
    }, [user]);

    const addPurchase = useCallback(async (purchase: Omit<Purchase, 'id'>) => {
        if (!user) return;

        const { data, error } = await supabase
            .from('purchases')
            .insert({
                user_id: user.id,
                location: purchase.location,
                value: purchase.value,
                date: purchase.date,
                notes: purchase.notes,
            })
            .select()
            .single();

        if (!error && data) {
            setPurchases(prev => [{
                id: data.id,
                location: data.location,
                value: parseFloat(data.value),
                date: data.date,
                notes: data.notes || '',
            }, ...prev]);
        }
    }, [user]);

    const deletePurchase = useCallback(async (id: number) => {
        if (!user) return;

        const { error } = await supabase
            .from('purchases')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (!error) {
            setPurchases(prev => prev.filter(p => p.id !== id));
        }
    }, [user]);

    return {
        purchases,
        isLoading,
        addPurchase,
        deletePurchase,
    };
}
