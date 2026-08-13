import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../infrastructure/supabase/client';

export function usePublicTenant(slug: string | undefined) {
  const { data: tenantData, isLoading } = useQuery({
    queryKey: ['public-tenant', slug],
    queryFn: async () => {
      if (!slug) return null;
      // Ya no usamos limit(1). Usamos la RPC para obtener el catálogo de un tenant.
      // Retornamos el payload de la RPC.
      const { data, error } = await supabase.rpc('get_tenant_catalog', { p_slug: slug });
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
    staleTime: Infinity,
  });

  return { tenantData, isLoading };
}
