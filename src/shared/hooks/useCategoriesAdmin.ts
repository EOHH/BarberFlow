import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesRepository } from '../../infrastructure/supabase/repositories/categories.repository';

export function useCategoriesAdmin() {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoriesRepository.getCategories(),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => categoriesRepository.createCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    }
  });

  return {
    categories,
    isLoading,
    isError,
    createCategory: createCategoryMutation.mutateAsync,
    isCreating: createCategoryMutation.isPending
  };
}
