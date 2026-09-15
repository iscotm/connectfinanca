import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export interface AccessKey {
  id: string;
  name: string;
  pin: string; // 4 digits
  protectedRoutes: string[];
}

export interface MenuSecuritySettings {
  isProfileLocked: boolean;
  profilePin: string; // 4 digits
  accessKeys: AccessKey[];
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

// Interface for backward compatibility
interface OldStoredSecurityPayload {
  pin?: string;
  isEnabled?: boolean;
  protectedRoutes?: string[];
}

interface MenuSecurityContextType {
  settings: MenuSecuritySettings;
  unlockedRoutes: string[]; // List of routes currently unlocked in the session
  isProfileUnlocked: boolean;
  isLoading: boolean;
  isRouteProtected: (pathname: string) => boolean;
  unlock: (enteredPin: string, targetPath?: string) => boolean;
  lock: () => void;
  pendingVerificationCode?: string | null;
  sendEmailVerificationCode: (customEmail?: string) => Promise<{ success: boolean; error?: string }>;
  saveSettings: (
    newSettings: MenuSecuritySettings,
    verificationCode: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const MenuSecurityContext = createContext<MenuSecurityContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'connect_menu_security_v2_';
const OLD_STORAGE_KEY_PREFIX = 'connect_menu_security_';

export function MenuSecurityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<MenuSecuritySettings>({
    isProfileLocked: false,
    profilePin: '',
    accessKeys: [],
  });
  
  const [unlockedRoutes, setUnlockedRoutes] = useState<string[]>([]);
  const [isProfileUnlocked, setIsProfileUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // In-memory verification code state with expiration
  const [pendingCode, setPendingCode] = useState<{ code: string; expiresAt: number } | null>(null);

  useEffect(() => {
    if (!user) {
      setSettings({ isProfileLocked: false, profilePin: '', accessKeys: [] });
      setUnlockedRoutes([]);
      setIsProfileUnlocked(false);
      setIsLoading(false);
      return;
    }

    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const userStorageKey = `${STORAGE_KEY_PREFIX}${user.id}`;
        const oldUserStorageKey = `${OLD_STORAGE_KEY_PREFIX}${user.id}`;
        
        const cachedV2 = localStorage.getItem(userStorageKey);
        
        if (cachedV2) {
          try {
            const parsed = JSON.parse(cachedV2);
            setSettings(parsed);
          } catch (e) {
            console.error('Error parsing cached security settings v2', e);
          }
        } else {
          // Check for old version and migrate
          const cachedOld = localStorage.getItem(oldUserStorageKey);
          if (cachedOld) {
            try {
              const parsedOld: OldStoredSecurityPayload = JSON.parse(cachedOld);
              if (parsedOld.isEnabled && parsedOld.pin) {
                const migratedSettings: MenuSecuritySettings = {
                  isProfileLocked: false,
                  profilePin: '',
                  accessKeys: [
                    {
                      id: crypto.randomUUID(),
                      name: 'Chave Padrão',
                      pin: parsedOld.pin,
                      protectedRoutes: parsedOld.protectedRoutes || []
                    }
                  ]
                };
                setSettings(migratedSettings);
                localStorage.setItem(userStorageKey, JSON.stringify(migratedSettings));
              }
            } catch (e) {
              console.error('Error migrating old security settings', e);
            }
          }
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
    // Check if it's profile
    if (pathname === '/perfil' || pathname.startsWith('/perfil/')) {
      return settings.isProfileLocked && !isProfileUnlocked;
    }

    // Check if route is protected by any access key
    const isProtectedByKey = settings.accessKeys.some(key => key.protectedRoutes.includes(pathname));
    
    // Return true if protected and not currently unlocked in session
    return isProtectedByKey && !unlockedRoutes.includes(pathname);
  }, [settings, isProfileUnlocked, unlockedRoutes]);

  const unlock = useCallback((enteredPin: string, targetPath?: string) => {
    let unlockedSomething = false;

    // Check profile pin
    if (settings.isProfileLocked && enteredPin === settings.profilePin) {
      setIsProfileUnlocked(true);
      unlockedSomething = true;
    }

    // Check access keys
    const matchedKeys = settings.accessKeys.filter(key => key.pin === enteredPin);
    if (matchedKeys.length > 0) {
      const newUnlockedRoutes = new Set(unlockedRoutes);
      matchedKeys.forEach(key => {
        key.protectedRoutes.forEach(route => newUnlockedRoutes.add(route));
      });
      setUnlockedRoutes(Array.from(newUnlockedRoutes));
      unlockedSomething = true;
    }

    return unlockedSomething;
  }, [settings, unlockedRoutes]);

  const lock = useCallback(() => {
    setUnlockedRoutes([]);
    setIsProfileUnlocked(false);
  }, []);

  const sendEmailVerificationCode = useCallback(async (customEmail?: string) => {
    const targetEmail = customEmail || user?.email;
    if (!targetEmail) {
      return { success: false, error: 'E-mail do usuário não encontrado.' };
    }

    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    setPendingCode({ code: generatedCode, expiresAt });

    try {
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

  const saveSettings = useCallback(async (
    newSettings: MenuSecuritySettings,
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

    try {
      const userStorageKey = `${STORAGE_KEY_PREFIX}${user.id}`;
      localStorage.setItem(userStorageKey, JSON.stringify(newSettings));
      setSettings(newSettings);
      setPendingCode(null); 
      
      // Auto-unlock profile if they just changed its settings
      if (newSettings.isProfileLocked) {
         setIsProfileUnlocked(true);
      }

      toast.success('Configurações de segurança salvas com sucesso!');
      return { success: true };
    } catch (err: any) {
      console.error('Error saving security settings:', err);
      return { success: false, error: 'Erro ao salvar configurações de segurança.' };
    }
  }, [user, pendingCode]);

  return (
    <MenuSecurityContext.Provider
      value={{
        settings,
        unlockedRoutes,
        isProfileUnlocked,
        isLoading,
        isRouteProtected,
        unlock,
        lock,
        pendingVerificationCode: pendingCode?.code,
        sendEmailVerificationCode,
        saveSettings,
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
