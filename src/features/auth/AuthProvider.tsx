import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../infrastructure/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import { AuthContext, type TenantResolutionStatus } from './AuthContext';
import {
  onboardingRepository,
  type OnboardingResolution,
} from '../../infrastructure/supabase/repositories/onboarding.repository';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantResolution, setTenantResolution] = useState<OnboardingResolution | null>(null);
  const [tenantResolutionStatus, setTenantResolutionStatus] = useState<TenantResolutionStatus>('idle');
  const [tenantResolutionError, setTenantResolutionError] = useState<string | null>(null);
  const tenantResolutionRequest = useRef(0);

  const refreshTenantResolution = useCallback(async () => {
    const requestId = ++tenantResolutionRequest.current;

    if (!session) {
      setTenantResolution(null);
      setTenantResolutionStatus('idle');
      setTenantResolutionError(null);
      return null;
    }

    setTenantResolutionStatus('loading');
    setTenantResolutionError(null);

    try {
      const resolution = await onboardingRepository.resolve();
      if (requestId !== tenantResolutionRequest.current) return null;
      setTenantResolution(resolution);
      setTenantResolutionStatus(resolution.status);
      return resolution;
    } catch {
      if (requestId !== tenantResolutionRequest.current) return null;
      setTenantResolution(null);
      setTenantResolutionStatus('error');
      setTenantResolutionError('No pudimos verificar tu barbería. Revisa tu conexión e inténtalo nuevamente.');
      return null;
    }
  }, [session]);

  useEffect(() => {
    let authEventVersion = 0;
    const initialVersion = authEventVersion;

    // 1. Obtener la sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (authEventVersion !== initialVersion) return;
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // 2. Escuchar cambios de autenticación (login, logout, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        authEventVersion += 1;
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    void refreshTenantResolution();
  }, [refreshTenantResolution]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error('No se pudo cerrar la sesión.');
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      isLoading,
      tenantResolution,
      tenantResolutionStatus,
      tenantResolutionError,
      refreshTenantResolution,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
