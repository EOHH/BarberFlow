import { supabase } from '../client';
import type { ServiceCategory } from '../../../types';

export class CategoriesRepository {
  async getCategories(): Promise<ServiceCategory[]> {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener categorías: ${error.message}`);
    }
    return data as ServiceCategory[];
  }

  async createCategory(name: string): Promise<ServiceCategory> {
    const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenant) throw new Error("No se pudo identificar el Tenant del usuario.");

    const { data, error } = await supabase
      .from('service_categories')
      .insert([{ name: name.trim(), tenant_id: tenant.id }])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear categoría: ${error.message}`);
    }
    return data as ServiceCategory;
  }
}

export const categoriesRepository = new CategoriesRepository();
