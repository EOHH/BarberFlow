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
import { Toaster } from 'sileo';

const notificationOptions = {
  fill: '#171717',
  roundness: 18,
  duration: 4600,
  autopilot: { expand: 180, collapse: 4200 },
  styles: {
    title: 'barberflow-notification-title',
    description: 'barberflow-notification-description',
    badge: 'barberflow-notification-badge',
  },
} as const;

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TenantThemeProvider>
          {children}
          <Toaster
            position="top-center"
            offset={{ top: 16, left: 12, right: 12 }}
            options={notificationOptions}
          />
        </TenantThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
