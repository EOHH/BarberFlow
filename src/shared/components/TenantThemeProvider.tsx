import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../infrastructure/supabase/client';

const THEMES: Record<string, { primary: string, ring: string }> = {
  gold: { primary: '#D4AF37', ring: '#D4AF37' },
  emerald: { primary: '#10B981', ring: '#10B981' },
  indigo: { primary: '#6366F1', ring: '#6366F1' },
  rose: { primary: '#F43F5E', ring: '#F43F5E' },
  slate: { primary: '#64748B', ring: '#64748B' },
};

export function TenantThemeProvider({ children }: { children: React.ReactNode }) {
  // En un entorno Multi-Tenant real, se debe buscar por dominio (ej. window.location.hostname).
  // Para el MVP, asumimos que estamos cargando el primer tenant.
  const { data: tenant } = useQuery({
    queryKey: ['public-tenant'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tenants').select('*').single();
      if (error) return null;
      return data;
    },
    staleTime: Infinity, // No refetch constantemente
  });

  useEffect(() => {
    if (tenant?.theme_color) {
      const selectedTheme = THEMES[tenant.theme_color] || THEMES['gold'];
      const root = document.documentElement;
      
      root.style.setProperty('--primary', selectedTheme.primary);
      root.style.setProperty('--ring', selectedTheme.ring);
    }
  }, [tenant?.theme_color]);

  return <>{children}</>;
}
