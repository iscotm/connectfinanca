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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from database
  const fetchProfile = async (userId: string): Promise<{ user?: User; company?: Company; error?: string }> => {
    try {
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        // Tenta buscar o email do usuário via getSession
        const { data: sessionData } = await supabase.auth.getSession();
        const userEmail = sessionData?.session?.user?.email || '';

        // Auto-cria o perfil básico APENAS caso não exista (ignoreDuplicates: true)
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: userEmail,
            name: userEmail.split('@')[0] || 'Usuário',
            role: userEmail.toLowerCase() === 'admin@gmail.com' ? 'admin' : 'user',
            status: 'ativo',
            access_type: 'Acesso Manual',
            updated_at: new Date().toISOString()
          }, { onConflict: 'id', ignoreDuplicates: true })
          .select()
          .single();
          
        if (insertError || !newProfile) {
          console.error("ERRO AO AUTO CRIAR:", insertError);
          return { error: `Erro interno ao criar perfil: ${insertError?.message || 'Desconhecido'}. Código: ${insertError?.code}` };
        }
        profile = newProfile;
      }

      // Check access rules
      const status = profile.status || 'ativo';
      const expiresAt = profile.access_expires_at ? new Date(profile.access_expires_at) : null;
      const now = new Date();
      
      if (status === 'pausado') {
        return { error: 'Seu acesso está pausado. Entre em contato com o suporte.' };
      }
      
      if (status === 'bloqueado') {
        return { error: 'Seu acesso foi bloqueado. Entre em contato com o administrador.' };
      }
      
      if (status === 'expirado' || (expiresAt && expiresAt < now)) {
        if (status !== 'expirado') {
           supabase.from('profiles').update({ status: 'expirado' }).eq('id', userId)
             .then(({ error }) => { if (error) console.error('Failed to set expired status:', error); })
             .catch(err => console.error('Unexpected error setting expired status:', err));
        }
        return { error: 'Sua assinatura expirou. Renove seu plano para continuar.' };
      }

      // Update last login
      supabase.from('profiles').update({ last_login_at: now.toISOString() }).eq('id', userId)
        .then(({ error }) => { if (error) console.error('Failed to update last login:', error); })
        .catch(err => console.error('Unexpected error updating last login:', err));

      return {
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name || profile.email.split('@')[0],
          role: profile.role || 'user',
          status: status,
          access_type: profile.access_type || 'Sem plano',
          access_expires_at: profile.access_expires_at,
          plan_id: profile.plan_id,
        },
        company: {
          razaoSocial: profile.razao_social || '',
          cnpj: profile.cnpj || '',
        },
      };
    } catch {
      return { error: 'Erro de conexão ao buscar perfil.' };
    }
  };

  // Check initial session on mount
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          if (mounted && profileData) {
            if (profileData.error) {
              await supabase.auth.signOut();
            } else if (profileData.user && profileData.company) {
              setUser(profileData.user);
              setCompany(profileData.company);
            }
          }
        }
      } catch (error) {
        console.error('Session init error:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setIsLoading(false);
        if (error.message === 'Invalid login credentials') {
          return { error: 'E-mail ou senha incorretos' };
        }
        return { error: error.message };
      }

      if (!data.user) {
        setIsLoading(false);
        return { error: 'Erro ao fazer login' };
      }

      // Fetch profile
      const profileData = await fetchProfile(data.user.id);

      if (profileData.error) {
        await supabase.auth.signOut();
        setIsLoading(false);
        return { error: profileData.error };
      }

      if (profileData.user && profileData.company) {
        setUser(profileData.user);
        setCompany(profileData.company);
      }
      setIsLoading(false);
      return {};
    } catch (err) {
      console.error('Login error:', err);
      setIsLoading(false);
      return { error: 'Erro ao fazer login. Tente novamente.' };
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
