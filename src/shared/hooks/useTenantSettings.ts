import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantRepository } from '../../infrastructure/supabase/repositories/tenant.repository';
import type { Tenant } from '../../types';
import { toast } from 'sonner';

export function useTenantSettings() {
  const queryClient = useQueryClient();
  const queryKey = ['tenant-settings'];

  const { data: tenant, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => tenantRepository.getCurrentTenant(),
  });

  const updateTenantMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Tenant> }) => 
      tenantRepository.updateTenant(id, updates),
    onSuccess: (updatedTenant) => {
      queryClient.setQueryData(queryKey, updatedTenant);
      queryClient.setQueryData(['public-tenant'], updatedTenant);
      queryClient.invalidateQueries({ queryKey: ['public-tenant'] });
      toast.success('Configuración guardada exitosamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar configuración: ' + error.message);
    }
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => tenantRepository.uploadLogo(file),
    onError: (error) => {
      toast.error('Error al subir logo: ' + error.message);
    }
  });

  return {
    tenant,
    isLoading,
    isError,
    updateTenant: updateTenantMutation.mutateAsync,
    uploadLogo: uploadLogoMutation.mutateAsync,
    isUpdating: updateTenantMutation.isPending,
    isUploading: uploadLogoMutation.isPending,
  };
}
