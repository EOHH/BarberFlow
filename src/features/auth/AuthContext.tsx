import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { OnboardingResolution } from '../../infrastructure/supabase/repositories/onboarding.repository';

export type TenantResolutionStatus = 'idle' | 'loading' | 'ready' | 'needs_onboarding' | 'error';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  tenantResolution: OnboardingResolution | null;
  tenantResolutionStatus: TenantResolutionStatus;
  tenantResolutionError: string | null;
  refreshTenantResolution: () => Promise<OnboardingResolution | null>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  tenantResolution: null,
  tenantResolutionStatus: 'idle',
  tenantResolutionError: null,
  refreshTenantResolution: async () => null,
  signOut: async () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};
