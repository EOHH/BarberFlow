import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsRepository } from '../../infrastructure/supabase/repositories/clients.repository';
import type { Client } from '../../types';

export function useClientsAdmin() {
  const queryClient = useQueryClient();
  const queryKey = ['admin-clients'] as const;

  const { data: clients = [], isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => clientsRepository.getAllClients(),
  });

  const updateNotesMutation = useMutation({
    mutationFn: ({ client, notes }: { client: Client; notes: string }) =>
      clientsRepository.saveClientNotes({
        clientId: client.persisted_id,
        phone: client.phone,
        privateNotes: notes,
      }),
    onSuccess: async (result, variables) => {
      queryClient.setQueryData<Client[]>(queryKey, (currentClients) =>
        currentClients?.map((client) =>
          client.id === variables.client.id
            ? {
                ...client,
                id: result.clientId,
                persisted_id: result.clientId,
                is_virtual: false,
                private_notes: result.privateNotes,
              }
            : client
        )
      );
      await queryClient.invalidateQueries({ queryKey });
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
