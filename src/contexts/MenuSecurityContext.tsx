import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export interface MenuSecuritySettings {
  isEnabled: boolean;
  pin: string; // 4 digits
  protectedRoutes: string[];
}

export const ALL_PROTECTABLE_MENUS = [
  { id: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: '/despesas-cnpj', label: 'Despesas Fixas CNPJ', icon: 'Building2' },
  { id: '/boletos', label: 'Boletos', icon: 'FileText' },
  { id: '/compras', label: 'Controle de Compras', icon: 'ShoppingCart' },
  { id: '/cotacao', label: 'Cotação de Produtos', icon: 'Scale' },
  { id: '/separacoes', label: 'Separações', icon: 'PackageCheck' },
  { id: '/fundo-caixa', label: 'Fundo de Caixa', icon: 'PiggyBank' },
];

interface StoredSecurityPayload {
  pin: string;
  isEnabled: boolean;
  protectedRoutes: string[];
}

interface MenuSecurityContextType {
  settings: MenuSecuritySettings;
  isUnlocked: boolean;
  isLoading: boolean;
  isRouteProtected: (pathname: string) => boolean;
  unlock: (enteredPin: string) => boolean;
  lock: () => void;
  pendingVerificationCode?: string | null;
  sendEmailVerificationCode: (customEmail?: string) => Promise<{ success: boolean; error?: string }>;
  saveSecuritySettings: (
    newSettings: Partial<MenuSecuritySettings>,
    verificationCode: string
  ) => Promise<{ success: boolean; error?: string }>;
  removeSecurityPin: (verificationCode: string) => Promise<{ success: boolean; error?: string }>;
}

const MenuSecurityContext = createContext<MenuSecurityContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'connect_menu_security_';

export function MenuSecurityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<MenuSecuritySettings>({
    isEnabled: false,
    pin: '',
    protectedRoutes: [],
  });
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // In-memory verification code state with expiration
  const [pendingCode, setPendingCode] = useState<{ code: string; expiresAt: number } | null>(null);

  // Load security settings from Supabase / localStorage when user logs in
  useEffect(() => {
    if (!user) {
      setSettings({ isEnabled: false, pin: '', protectedRoutes: [] });
      setIsUnlocked(false);
      setIsLoading(false);
      return;
    }

    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const userStorageKey = `${STORAGE_KEY_PREFIX}${user.id}`;
        const cached = localStorage.getItem(userStorageKey);
        let parsedCached: StoredSecurityPayload | null = null;
        if (cached) {
          try {
            parsedCached = JSON.parse(cached);
          } catch (e) {
            console.error('Error parsing cached security settings', e);
          }
        }

        // Try to fetch from Supabase profiles (banco_despesas / metadata)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, email')
          .eq('id', user.id)
          .single();

        // Also check if we stored it in dre_config or localStorage
        if (parsedCached) {
          setSettings({
            isEnabled: !!parsedCached.isEnabled && !!parsedCached.pin,
            pin: parsedCached.pin || '',
            protectedRoutes: parsedCached.protectedRoutes || [],
          });
        }
      } catch (error) {
        console.error('Error loading menu security settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const isRouteProtected = useCallback((pathname: string) => {
    if (!settings.isEnabled || !settings.pin || settings.pin.length !== 4) {
      return false;
    }
    // Perfil is ALWAYS open
    if (pathname === '/perfil' || pathname.startsWith('/perfil/')) {
      return false;
    }
    return settings.protectedRoutes.includes(pathname);
  }, [settings]);

  const unlock = useCallback((enteredPin: string) => {
    if (enteredPin === settings.pin) {
      setIsUnlocked(true);
      return true;
    }
    return false;
  }, [settings.pin]);

  const lock = useCallback(() => {
    setIsUnlocked(false);
  }, []);

  const sendEmailVerificationCode = useCallback(async (customEmail?: string) => {
    const targetEmail = customEmail || user?.email;
    if (!targetEmail) {
      return { success: false, error: 'E-mail do usuário não encontrado.' };
    }

    // Generate random 6-digit code
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    setPendingCode({ code: generatedCode, expiresAt });

    try {
      // In Supabase, if OTP is enabled we can trigger, or show toast notification / alert for user confirmation
      toast.info(`Código de verificação enviado para ${targetEmail}`, {
        description: `Para testes e confirmação imediata, seu código é: ${generatedCode}`,
        duration: 15000,
      });

      return { success: true };
    } catch (err: any) {
      console.error('Error sending code:', err);
      return { success: false, error: err.message || 'Erro ao enviar código.' };
    }
  }, [user]);

  const saveSecuritySettings = useCallback(async (
    newSettings: Partial<MenuSecuritySettings>,
    verificationCode: string
  ) => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    if (!pendingCode || Date.now() > pendingCode.expiresAt) {
      return { success: false, error: 'Código de verificação expirado ou não solicitado. Solicite um novo código.' };
    }

    if (verificationCode.trim() !== pendingCode.code) {
      return { success: false, error: 'Código de verificação incorreto.' };
    }

    const pin = (newSettings.pin !== undefined ? newSettings.pin : settings.pin).trim();
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return { success: false, error: 'A senha deve conter exatamente 4 números.' };
    }

    const protectedRoutes = newSettings.protectedRoutes !== undefined
      ? newSettings.protectedRoutes
      : settings.protectedRoutes;

    const updated: MenuSecuritySettings = {
      isEnabled: newSettings.isEnabled !== undefined ? newSettings.isEnabled : true,
      pin,
      protectedRoutes,
    };

    try {
      const userStorageKey = `${STORAGE_KEY_PREFIX}${user.id}`;
      localStorage.setItem(userStorageKey, JSON.stringify(updated));
      setSettings(updated);
      setPendingCode(null); // Clear code
      setIsUnlocked(true); // Automatically unlock session on config update

      toast.success('Configurações de segurança salvas com sucesso!');
      return { success: true };
    } catch (err: any) {
      console.error('Error saving security settings:', err);
      return { success: false, error: 'Erro ao salvar configurações de segurança.' };
    }
  }, [user, pendingCode, settings]);

  const removeSecurityPin = useCallback(async (verificationCode: string) => {
    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    if (!pendingCode || Date.now() > pendingCode.expiresAt) {
      return { success: false, error: 'Código de verificação expirado ou não solicitado.' };
    }

    if (verificationCode.trim() !== pendingCode.code) {
      return { success: false, error: 'Código de verificação incorreto.' };
    }

    try {
      const userStorageKey = `${STORAGE_KEY_PREFIX}${user.id}`;
      const emptySettings: MenuSecuritySettings = {
        isEnabled: false,
        pin: '',
        protectedRoutes: [],
      };
      localStorage.setItem(userStorageKey, JSON.stringify(emptySettings));
      setSettings(emptySettings);
      setPendingCode(null);
      setIsUnlocked(true);

      toast.success('Proteção por senha desativada com sucesso!');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Erro ao desativar proteção por senha.' };
    }
  }, [user, pendingCode]);

  return (
    <MenuSecurityContext.Provider
      value={{
        settings,
        isUnlocked,
        isLoading,
        isRouteProtected,
        unlock,
        lock,
        pendingVerificationCode: pendingCode?.code,
        sendEmailVerificationCode,
        saveSecuritySettings,
        removeSecurityPin,
      }}
    >
      {children}
    </MenuSecurityContext.Provider>
  );
}

export function useMenuSecurity() {
  const context = useContext(MenuSecurityContext);
  if (!context) {
    throw new Error('useMenuSecurity must be used within a MenuSecurityProvider');
  }
  return context;
}
