import { supabase } from '../client';
import type { IAdminRepository } from '../../../core/interfaces/admin.repository.interface';
import type { Appointment, Service } from '../../../types';

export class AdminRepository implements IAdminRepository {
  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', date)
      .order('time', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener las citas: ${error.message}`);
    }
    return data as Appointment[];
  }

  async getAppointmentsByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener las citas por rango: ${error.message}`);
    }
    return data as Appointment[];
  }

  async updateAppointmentStatus(id: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed'): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (error) {
      throw new Error(`Error al actualizar el estado de la cita: ${error.message}`);
    }
  }

  async getAllServices(): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*, category:service_categories(*)')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener los servicios: ${error.message}`);
    }
    return data as Service[];
  }

  async createService(service: Omit<Service, 'id' | 'created_at'>): Promise<Service> {
    const { data: tenant } = await supabase.from('tenants').select('id').single();
    if (!tenant) throw new Error("No se pudo identificar el Tenant del usuario.");

    const payload = { ...service, tenant_id: tenant.id };

    const { data, error } = await supabase
      .from('services')
      .insert([payload])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear el servicio: ${error.message}`);
    }
    return data as Service;
  }

  async updateService(id: string, service: Partial<Omit<Service, 'id' | 'created_at'>>): Promise<Service> {
    const { data, error } = await supabase
      .from('services')
      .update(service)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar el servicio: ${error.message}`);
    }
    return data as Service;
  }

  async deleteService(id: string): Promise<void> {
    // Soft Delete
    const { error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar (soft delete) el servicio: ${error.message}`);
    }
  }

  async uploadImage(file: File): Promise<string> {
    const { data: tenant } = await supabase.from('tenants').select('id').single();
    if (!tenant) throw new Error("No se pudo identificar el Tenant del usuario.");

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${tenant.id}/services/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('brand_assets')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw new Error(`Error uploading image: ${uploadError.message}`);

    const { data } = supabase.storage.from('brand_assets').getPublicUrl(filePath);
    return data.publicUrl;
  }
}

export const adminRepository = new AdminRepository();
