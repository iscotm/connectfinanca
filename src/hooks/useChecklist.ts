import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Task {
    id: number;
    name: string;
    frequency: 'unica' | 'diaria' | 'semanal' | 'mensal';
    nextDate: string;
    status: 'pending' | 'completed' | 'overdue';
}

export function useChecklist() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load tasks
    useEffect(() => {
        if (!user) {
            setTasks([]);
            setIsLoading(false);
            return;
        }

        const loadTasks = async () => {
            setIsLoading(true);
            try {
                const { data } = await supabase
                    .from('checklist_tasks')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (data) {
                    setTasks(data.map(t => ({
                        id: t.id,
                        name: t.name,
                        frequency: t.frequency as Task['frequency'],
                        nextDate: t.next_date,
                        status: t.status as Task['status'],
                    })));
                }
            } catch (error) {
                console.error('Error loading tasks:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadTasks();
    }, [user]);

    const addTask = useCallback(async (task: Omit<Task, 'id' | 'status'>) => {
        if (!user) return;

        const { data, error } = await supabase
            .from('checklist_tasks')
            .insert({
                user_id: user.id,
                name: task.name,
                frequency: task.frequency,
                next_date: task.nextDate,
                status: 'pending',
            })
            .select()
            .single();

        if (!error && data) {
            setTasks(prev => [{
                id: data.id,
                name: data.name,
                frequency: data.frequency as Task['frequency'],
                nextDate: data.next_date,
                status: data.status as Task['status'],
            }, ...prev]);
        }
    }, [user]);

    const updateTask = useCallback(async (id: number, taskData: Partial<Task>) => {
        if (!user) return;

        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (taskData.name !== undefined) updateData.name = taskData.name;
        if (taskData.frequency !== undefined) updateData.frequency = taskData.frequency;
        if (taskData.nextDate !== undefined) updateData.next_date = taskData.nextDate;
        if (taskData.status !== undefined) updateData.status = taskData.status;

        const { error } = await supabase
            .from('checklist_tasks')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id);

        if (!error) {
            setTasks(prev => prev.map(t =>
                t.id === id ? { ...t, ...taskData } : t
            ));
        }
    }, [user]);

    const deleteTask = useCallback(async (id: number) => {
        if (!user) return;

        const { error } = await supabase
            .from('checklist_tasks')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (!error) {
            setTasks(prev => prev.filter(t => t.id !== id));
        }
    }, [user]);

    const completeTask = useCallback(async (id: number) => {
        await updateTask(id, { status: 'completed' });
    }, [updateTask]);

    return {
        tasks,
        isLoading,
        addTask,
        updateTask,
        deleteTask,
        completeTask,
    };
}
