import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  status: 'ativo' | 'pausado' | 'bloqueado' | 'expirado';
  access_type: string;
  access_expires_at?: string | null;
  plan_id?: string | null;
  phone?: string | null;
}

interface Company {
  razaoSocial: string;
  cnpj: string;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  updateProfile: (user: Partial<User>, company: Partial<Company>) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from database
  const fetchProfile = async (userId: string, userEmail?: string): Promise<{ user?: User; company?: Company; error?: string }> => {
    try {
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !profile) {
        const emailToUse = userEmail || '';

        // Auto-cria o perfil básico APENAS caso não exista (ignoreDuplicates: true)
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: emailToUse,
            name: emailToUse ? emailToUse.split('@')[0] : 'Usuário',
            role: emailToUse.toLowerCase() === 'admin@gmail.com' ? 'admin' : 'user',
            status: 'ativo',
            access_type: 'Sem plano',
            updated_at: new Date().toISOString()
          }, { onConflict: 'id', ignoreDuplicates: true })
          .select()
          .maybeSingle();
          
        if (insertError) {
          console.warn("ERRO AO AUTO CRIAR:", insertError);
        }
        profile = newProfile || {
          id: userId,
          email: emailToUse,
          name: emailToUse ? emailToUse.split('@')[0] : 'Usuário',
          role: 'user',
          status: 'ativo',
          access_type: 'Sem plano',
          razao_social: '',
          cnpj: '',
        };
      }

      // 1. Fetch active subscriptions from new table (safely without blocking)
      let activeSub: any = null;
      try {
        const { data: subscriptions } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .in('status', ['active', 'past_due']);

        const now = new Date();
        if (subscriptions && subscriptions.length > 0) {
          for (const sub of subscriptions) {
            if (sub.status === 'active') {
              const expiresAt = sub.current_period_end ? new Date(sub.current_period_end) : null;
              if (expiresAt && expiresAt < now) {
                supabase.from('subscriptions').update({ status: 'expired' }).eq('id', sub.id);
              } else {
                activeSub = sub;
                break;
              }
            }
          }
        }
      } catch (e) {
        console.warn('Subscriptions check notice:', e);
      }

      let finalStatus = profile.status || 'ativo';
      let accessType = profile.access_type || 'Sem plano';

      if (profile.status === 'pausado') {
        return { error: 'Seu acesso está pausado. Entre em contato com o suporte.' };
      }
      
      if (profile.status === 'bloqueado') {
        return { error: 'Seu acesso foi bloqueado. Entre em contato com o administrador.' };
      }
      
      if (activeSub) {
        finalStatus = 'ativo';
        accessType = activeSub.plan || 'Plano Ativo';
      }

      // Update last login in background
      supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', userId).then();

      return {
        user: {
          id: profile.id,
          email: profile.email || userEmail || '',
          name: profile.name || (profile.email ? profile.email.split('@')[0] : 'Usuário'),
          role: profile.role || 'user',
          status: finalStatus as 'ativo' | 'pausado' | 'bloqueado' | 'expirado',
          access_type: accessType,
          access_expires_at: activeSub ? activeSub.current_period_end : profile.access_expires_at,
          plan_id: profile.plan_id,
          phone: profile.phone || '',
        },
        company: {
          razaoSocial: profile.razao_social || '',
          cnpj: profile.cnpj || '',
        },
      };
    } catch (err: any) {
      console.error('fetchProfile error:', err);
      return { error: 'Erro ao carregar perfil do usuário.' };
    }
  };

  // Check initial session on mount
  useEffect(() => {
    let mounted = true;

    // Safety timeout: ensure isLoading is never stuck in true
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        setIsLoading(false);
      }
    }, 15000);

    const handleSessionUser = async (sessionUser: SupabaseUser | null) => {
      if (!sessionUser) {
        if (mounted) {
          setUser(null);
          setCompany(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const profileData = await fetchProfile(sessionUser.id, sessionUser.email);
        if (mounted) {
          const defaultUser: User = {
            id: sessionUser.id,
            email: sessionUser.email || '',
            name: sessionUser.user_metadata?.name || (sessionUser.email ? sessionUser.email.split('@')[0] : 'Usuário'),
            role: sessionUser.email?.toLowerCase() === 'admin@gmail.com' ? 'admin' : 'user',
            status: 'ativo',
            access_type: 'Plano Ativo',
            phone: sessionUser.user_metadata?.phone || '',
          };
          const defaultCompany: Company = {
            razaoSocial: sessionUser.user_metadata?.razaoSocial || '',
            cnpj: sessionUser.user_metadata?.cnpj || '',
          };

          setUser(profileData.user || defaultUser);
          setCompany(profileData.company || defaultCompany);
        }
      } catch (error) {
        console.error('Error handling session user:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setCompany(null);
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        if (event === 'USER_UPDATED' && session.user.email) {
          try {
            await supabase
              .from('profiles')
              .update({ email: session.user.email, updated_at: new Date().toISOString() })
              .eq('id', session.user.id);
          } catch (e) {
            console.error('Error updating profile email on USER_UPDATED:', e);
          }
        }
        await handleSessionUser(session.user);
      } else {
        if (mounted) {
          setUser(null);
          setCompany(null);
          setIsLoading(false);
        }
      }
    });

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        handleSessionUser(session.user);
      } else {
        setIsLoading(false);
      }
    }).catch(err => {
      console.error('getSession error:', err);
      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    setIsLoading(true);

    try {
      // Force clear any hanging sessions or auth locks before attempting a new login
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-') && key.includes('-auth-token')) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {}
      await supabase.auth.signOut().catch(() => {});

      const trimmedEmail = email.trim();
      const loginReq = supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      const timeoutReq = new Promise<{ data: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Tempo de conexão esgotado ao tentar autenticar. Tente novamente.')), 30000)
      );

      const { data, error } = await Promise.race([loginReq, timeoutReq]) as any;

      if (error) {
        setIsLoading(false);
        if (error.message === 'Invalid login credentials') {
          return { error: 'E-mail ou senha incorretos' };
        }
        return { error: error.message };
      }

      if (!data?.user) {
        setIsLoading(false);
        return { error: 'Erro ao fazer login' };
      }

      // Fetch profile with fallback
      const profileData = await fetchProfile(data.user.id, data.user.email || trimmedEmail);

      const defaultUser: User = {
        id: data.user.id,
        email: data.user.email || trimmedEmail,
        name: data.user.user_metadata?.name || (data.user.email ? data.user.email.split('@')[0] : 'Usuário'),
        role: data.user.email?.toLowerCase() === 'admin@gmail.com' ? 'admin' : 'user',
        status: 'ativo',
        access_type: 'Plano Ativo',
        phone: data.user.user_metadata?.phone || '',
      };
      const defaultCompany: Company = {
        razaoSocial: data.user.user_metadata?.razaoSocial || '',
        cnpj: data.user.user_metadata?.cnpj || '',
      };

      setUser(profileData.user || defaultUser);
      setCompany(profileData.company || defaultCompany);
      setIsLoading(false);
      return {};
    } catch (err: any) {
      console.error('Login error:', err);
      setIsLoading(false);
      return { error: err?.message || 'Erro ao fazer login. Tente novamente.' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setCompany(null);
    // Force a redirect to login page in case React Router state update gets stuck
    window.location.href = '/login';
  };

  const updateProfile = async (userData: Partial<User>, companyData: Partial<Company>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          razao_social: companyData.razaoSocial,
          cnpj: companyData.cnpj,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (!error) {
        setUser(prev => prev ? { ...prev, ...userData } : null);
        setCompany(prev => prev ? { ...prev, ...companyData } : null);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const profileData = await fetchProfile(user.id, user.email);
      if (profileData.user && profileData.company) {
        setUser(profileData.user);
        setCompany(profileData.company);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateProfile,
        refreshProfile,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
