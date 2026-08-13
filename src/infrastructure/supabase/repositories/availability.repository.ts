import { supabase } from '../client';
import type { Availability } from '../../../types';

export class AvailabilityRepository {
  async getAvailabilityByBarber(barberId: string): Promise<Availability[]> {
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('barber_id', barberId)
      .order('day_of_week', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener los horarios: ${error.message}`);
    }
    return data as Availability[];
  }

  async upsertAvailability(barberId: string, availabilities: Omit<Availability, 'id' | 'tenant_id'>[]): Promise<void> {
    // In Supabase, upsert requires a primary key or unique constraint. 
    // Wait, we need to delete existing ones for the barber and insert new ones to avoid duplicate day_of_week
    // Or we use upsert if day_of_week + barber_id is a unique key.
    // Easiest is to delete and insert inside a transaction, or sequentially if Supabase REST.
    const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenant) throw new Error("No se pudo identificar el Tenant del usuario.");
    
    const { error: deleteError } = await supabase
      .from('availability')
      .delete()
      .eq('barber_id', barberId);

    if (deleteError) {
      throw new Error(`Error al limpiar los horarios antiguos: ${deleteError.message}`);
    }

    // Preparar payload eliminando propiedades sensibles y asegurando unicidad de días
    const uniqueDays = new Map<number, any>();
    availabilities.forEach(a => {
      if (a.day_of_week !== undefined) {
        uniqueDays.set(a.day_of_week, {
          day_of_week: a.day_of_week,
          start_time: a.start_time,
          end_time: a.end_time,
          is_active: a.is_active,
          barber_id: barberId,
          tenant_id: tenant.id
        });
      }
    });

    const payload = Array.from(uniqueDays.values());

    const { error: insertError } = await supabase
      .from('availability')
      .insert(payload);

    if (insertError) {
      throw new Error(`Error al guardar los nuevos horarios: ${insertError.message}`);
    }
  }
}

export const availabilityRepository = new AvailabilityRepository();
