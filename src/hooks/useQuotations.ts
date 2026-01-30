import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Quotation {
    id: number;
    name: string;
    products: string[];
    suppliers: string[];
    prices: Record<string, Record<string, number>>;
}

export function useQuotations() {
    const { user } = useAuth();
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [currentQuotation, setCurrentQuotation] = useState<Quotation | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load quotations
    useEffect(() => {
        if (!user) {
            setQuotations([]);
            setCurrentQuotation(null);
            setIsLoading(false);
            return;
        }

        const loadQuotations = async () => {
            setIsLoading(true);
            try {
                const { data } = await supabase
                    .from('quotations')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (data && data.length > 0) {
                    const mapped = data.map(q => ({
                        id: q.id,
                        name: q.name,
                        products: q.products as string[],
                        suppliers: q.suppliers as string[],
                        prices: q.prices as Record<string, Record<string, number>>,
                    }));
                    setQuotations(mapped);
                    setCurrentQuotation(mapped[0]);
                } else {
                    // Create a default quotation
                    const defaultQuotation = {
                        name: 'Nova Cotação',
                        products: [],
                        suppliers: [],
                        prices: {},
                    };

                    const { data: created } = await supabase
                        .from('quotations')
                        .insert({
                            user_id: user.id,
                            ...defaultQuotation,
                        })
                        .select()
                        .single();

                    if (created) {
                        const newQuotation = {
                            id: created.id,
                            name: created.name,
                            products: created.products as string[],
                            suppliers: created.suppliers as string[],
                            prices: created.prices as Record<string, Record<string, number>>,
                        };
                        setQuotations([newQuotation]);
                        setCurrentQuotation(newQuotation);
                    }
                }
            } catch (error) {
                console.error('Error loading quotations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadQuotations();
    }, [user]);

    const updateQuotation = useCallback(async (data: Partial<Quotation>) => {
        if (!user || !currentQuotation) return;

        const newQuotation = { ...currentQuotation, ...data };
        setCurrentQuotation(newQuotation);
        setQuotations(prev => prev.map(q =>
            q.id === currentQuotation.id ? newQuotation : q
        ));

        await supabase
            .from('quotations')
            .update({
                name: newQuotation.name,
                products: newQuotation.products,
                suppliers: newQuotation.suppliers,
                prices: newQuotation.prices,
                updated_at: new Date().toISOString(),
            })
            .eq('id', currentQuotation.id)
            .eq('user_id', user.id);
    }, [user, currentQuotation]);

    const addProduct = useCallback(async (productName: string) => {
        if (!currentQuotation || !productName || currentQuotation.products.includes(productName)) return;

        const newPrices: Record<string, number> = {};
        currentQuotation.suppliers.forEach(s => newPrices[s] = 0);

        await updateQuotation({
            products: [...currentQuotation.products, productName],
            prices: { ...currentQuotation.prices, [productName]: newPrices },
        });
    }, [currentQuotation, updateQuotation]);

    const addSupplier = useCallback(async (supplierName: string) => {
        if (!currentQuotation || !supplierName || currentQuotation.suppliers.includes(supplierName)) return;

        const newPrices = { ...currentQuotation.prices };
        Object.keys(newPrices).forEach(product => {
            newPrices[product][supplierName] = 0;
        });

        await updateQuotation({
            suppliers: [...currentQuotation.suppliers, supplierName],
            prices: newPrices,
        });
    }, [currentQuotation, updateQuotation]);

    const removeProduct = useCallback(async (productName: string) => {
        if (!currentQuotation) return;

        const newPrices = { ...currentQuotation.prices };
        delete newPrices[productName];

        await updateQuotation({
            products: currentQuotation.products.filter(p => p !== productName),
            prices: newPrices,
        });
    }, [currentQuotation, updateQuotation]);

    const removeSupplier = useCallback(async (supplierName: string) => {
        if (!currentQuotation) return;

        const newPrices = { ...currentQuotation.prices };
        Object.keys(newPrices).forEach(product => {
            delete newPrices[product][supplierName];
        });

        await updateQuotation({
            suppliers: currentQuotation.suppliers.filter(s => s !== supplierName),
            prices: newPrices,
        });
    }, [currentQuotation, updateQuotation]);

    const updatePrice = useCallback(async (product: string, supplier: string, value: number) => {
        if (!currentQuotation) return;

        await updateQuotation({
            prices: {
                ...currentQuotation.prices,
                [product]: {
                    ...currentQuotation.prices[product],
                    [supplier]: value,
                },
            },
        });
    }, [currentQuotation, updateQuotation]);

    return {
        quotations,
        currentQuotation,
        isLoading,
        updateQuotation,
        addProduct,
        addSupplier,
        removeProduct,
        removeSupplier,
        updatePrice,
    };
}
