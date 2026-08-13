import { supabase } from '../client';
import type { Tenant } from '../../../types';

export class TenantRepository {
  async getCurrentTenant(): Promise<Tenant> {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .single();

    if (error) throw new Error(`Error fetching tenant: ${error.message}`);
    return data as Tenant;
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Error updating tenant: ${error.message}`);
    return data as Tenant;
  }

  async uploadLogo(file: File): Promise<string> {
    const { data: tenant } = await supabase.from('tenants').select('id').single();
    if (!tenant) throw new Error("No se pudo identificar el Tenant del usuario.");

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${tenant.id}/logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('brand_assets')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw new Error(`Error uploading logo: ${uploadError.message}`);

    const { data } = supabase.storage.from('brand_assets').getPublicUrl(filePath);
    return data.publicUrl;
  }
}

export const tenantRepository = new TenantRepository();
