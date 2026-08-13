import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminRepository } from '../../infrastructure/supabase/repositories/admin.repository';
import type { Appointment } from '../../types';
import { toast } from 'sonner';

export function useAdminAppointments(date: string) {
  const queryClient = useQueryClient();
  const queryKey = ['admin-appointments', date];

  const { data: appointments = [], isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => adminRepository.getAppointmentsByDate(date),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Appointment['status'] }) => 
      adminRepository.updateAppointmentStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey });
      const previousAppointments = queryClient.getQueryData<Appointment[]>(queryKey);
      
      if (previousAppointments) {
        queryClient.setQueryData<Appointment[]>(queryKey, (old) => 
          old?.map(app => app.id === id ? { ...app, status } : app)
        );
      }
      return { previousAppointments };
    },
    onError: (err, _variables, context) => {
      // Revertir en caso de error
      if (context?.previousAppointments) {
        queryClient.setQueryData(queryKey, context.previousAppointments);
      }
      toast.error('Error al actualizar la cita: ' + err.message);
    },
    onSuccess: () => {
      toast.success('Estado actualizado correctamente');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    appointments,
    isLoading,
    isError,
    error,
    updateStatus: updateStatusMutation.mutateAsync,
  };
}
