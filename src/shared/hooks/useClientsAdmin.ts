import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsRepository } from '../../infrastructure/supabase/repositories/clients.repository';

export function useClientsAdmin() {
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading, isError, error } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: () => clientsRepository.getAllClients(),
  });

  const updateNotesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => 
      clientsRepository.updateClientNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
    },
  });

  return {
    clients,
    isLoading,
    isError,
    error,
    updateClientNotes: updateNotesMutation.mutateAsync,
  };
}
