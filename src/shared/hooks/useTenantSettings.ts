import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantRepository } from '../../infrastructure/supabase/repositories/tenant.repository';
import type { BookingConfirmationMode, Tenant } from '../../types';
import { notifications as toast } from '../lib/notifications';

export function useTenantSettings() {
  const queryClient = useQueryClient();
  const queryKey = ['tenant-settings'];

  const { data: tenant, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => tenantRepository.getCurrentTenant(),
  });

  const { data: currentUserRole, isLoading: isLoadingRole } = useQuery({
    queryKey: ['tenant-user-role'],
    queryFn: () => tenantRepository.getCurrentUserRole(),
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
    onError: () => {
      toast.error('No pudimos guardar la configuración', {
        description: 'Revisa tu conexión e inténtalo nuevamente.',
      });
    }
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => tenantRepository.uploadLogo(file),
    onError: () => {
      toast.error('No pudimos subir el logotipo', {
        description: 'Verifica el archivo y vuelve a intentarlo.',
      });
    }
  });

  const updateBookingConfirmationModeMutation = useMutation({
    mutationFn: (mode: BookingConfirmationMode) =>
      tenantRepository.updateBookingConfirmationMode(mode),
    onSuccess: (bookingConfirmationMode) => {
      queryClient.setQueryData<Tenant>(queryKey, (currentTenant) => {
        if (!currentTenant) return currentTenant;
        return {
          ...currentTenant,
          booking_confirmation_mode: bookingConfirmationMode,
        };
      });
      toast.success('Modalidad de reservas actualizada');
    },
    onError: () => {
      toast.error('No pudimos actualizar la modalidad', {
        description: 'La configuración anterior se mantiene sin cambios.',
      });
    },
  });

  return {
    tenant,
    isLoading,
    isError,
    currentUserRole,
    isLoadingRole,
    updateTenant: updateTenantMutation.mutateAsync,
    uploadLogo: uploadLogoMutation.mutateAsync,
    updateBookingConfirmationMode: updateBookingConfirmationModeMutation.mutateAsync,
    isUpdating: updateTenantMutation.isPending,
    isUploading: uploadLogoMutation.isPending,
    isUpdatingBookingConfirmationMode: updateBookingConfirmationModeMutation.isPending,
  };
}
