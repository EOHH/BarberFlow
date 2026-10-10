import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminRepository } from '../../infrastructure/supabase/repositories/admin.repository';
import type { Appointment } from '../../types';
import { notifications as toast } from '../lib/notifications';
import { useEffect } from 'react';
import { supabase } from '../../infrastructure/supabase/client';

export function useAdminAppointments(date: string) {
  const queryClient = useQueryClient();
  const queryKey = ['admin-appointments', date];

  const { data: appointments = [], isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => adminRepository.getAppointmentsByDate(date),
  });

  // Habilitar pruebas visuales: Supabase Realtime
  useEffect(() => {
    // Nos suscribimos a cualquier UPDATE en la tabla appointments
    const channel = supabase
      .channel('public:appointments')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'appointments' },
        (payload) => {
          console.log('Realtime Update recibido:', payload);
          // Invalidamos la caché para que React Query haga un refetch en background 
          // y la UI cambie de color / estado al instante.
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'appointments' },
        (payload) => {
          console.log('Realtime Insert recibido:', payload);
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, queryKey]);

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
    onError: (_err, _variables, context) => {
      // Revertir en caso de error
      if (context?.previousAppointments) {
        queryClient.setQueryData(queryKey, context.previousAppointments);
      }
      toast.error('No pudimos actualizar la cita', {
        description: 'Comprueba el estado actual e inténtalo nuevamente.',
      });
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
