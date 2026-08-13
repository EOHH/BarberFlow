import { supabase } from '../client';
import type { Barber } from '../../../types';

export class StaffRepository {
  async getAllBarbers(): Promise<Barber[]> {
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener los barberos: ${error.message}`);
    }
    return data as Barber[];
  }

  async createBarber(barber: Partial<Barber>): Promise<Barber> {
    const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenant) throw new Error("No se pudo identificar el Tenant del usuario.");

    const payload = { ...barber, tenant_id: tenant.id };

    const { data, error } = await supabase
      .from('barbers')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear el barbero: ${error.message}`);
    }
    return data as Barber;
  }

  async updateBarber(id: string, barber: Partial<Barber>): Promise<Barber> {
    const { data, error } = await supabase
      .from('barbers')
      .update(barber)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar el barbero: ${error.message}`);
    }
    return data as Barber;
  }

  async uploadAvatar(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('brand_assets')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw new Error(`Error uploading avatar: ${uploadError.message}`);

    const { data } = supabase.storage.from('brand_assets').getPublicUrl(filePath);
    return data.publicUrl;
  }

  async deleteBarber(id: string): Promise<void> {
    const { error } = await supabase
      .from('barbers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar el barbero: ${error.message}`);
    }
  }
}

export const staffRepository = new StaffRepository();
