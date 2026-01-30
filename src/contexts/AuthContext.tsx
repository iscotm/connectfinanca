import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
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
  const fetchProfile = async (userId: string): Promise<{ user: User; company: Company } | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return null;
      }

      return {
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name || profile.email.split('@')[0],
        },
        company: {
          razaoSocial: profile.razao_social || '',
          cnpj: profile.cnpj || '',
        },
      };
    } catch {
      return null;
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
            setUser(profileData.user);
            setCompany(profileData.company);
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

      if (!profileData) {
        await supabase.auth.signOut();
        setIsLoading(false);
        return { error: 'Usuário não autorizado. Entre em contato com o administrador.' };
      }

      setUser(profileData.user);
      setCompany(profileData.company);
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
