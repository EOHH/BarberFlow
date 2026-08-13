import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../infrastructure/supabase/client';
import type { Tenant } from '../../types';

export function usePublicTenant() {
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['public-tenant'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tenants').select('*').limit(1).single();
      if (error) throw error;
      return data as Tenant;
    },
    staleTime: Infinity,
  });

  return { tenant, isLoading };
}
