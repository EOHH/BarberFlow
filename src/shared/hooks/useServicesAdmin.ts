import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminRepository } from '../../infrastructure/supabase/repositories/admin.repository';
import type { Service } from '../../types';

export function useServicesAdmin() {
  const queryClient = useQueryClient();

  // Query para obtener todos los servicios activos
  const { data: services = [], isLoading, isError, error } = useQuery({
    queryKey: ['admin-services'],
    queryFn: () => adminRepository.getAllServices(),
  });

  // Mutación para crear
  const createMutation = useMutation({
    mutationFn: (newService: Omit<Service, 'id' | 'created_at'>) => adminRepository.createService(newService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    },
  });

  // Mutación para editar
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Service, 'id' | 'created_at'>> }) => 
      adminRepository.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    },
  });

  // Mutación para eliminar (soft delete)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminRepository.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => adminRepository.uploadImage(file),
    onError: (error) => {
      console.error('Error al subir imagen:', error);
    }
  });

  return {
    services,
    isLoading,
    isError,
    error,
    createService: createMutation.mutateAsync,
    updateService: updateMutation.mutateAsync,
    deleteService: deleteMutation.mutateAsync,
    uploadImage: uploadImageMutation.mutateAsync,
  };
}
