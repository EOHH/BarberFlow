import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface ProvidersProps {
  children: ReactNode;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Reintentar solo 1 vez en caso de fallo
      refetchOnWindowFocus: false, // Opcional pero recomendado para UX
    },
    mutations: {
      retry: false, // No reintentar mutaciones, mostrar el error directo
    },
  },
});

import { AuthProvider } from '../features/auth/AuthProvider';
import { TenantThemeProvider } from '../shared/components/TenantThemeProvider';
import { Toaster } from 'sonner';

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TenantThemeProvider>
          {children}
          <Toaster position="top-center" richColors />
        </TenantThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
