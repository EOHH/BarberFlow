import { supabase } from '../client';
import type { IBookingRepository } from '../../../core/interfaces/booking.repository.interface';
import type { Service, Availability, Appointment, BookingFormInput, Barber } from '../../../types';
import { toast } from 'sonner';

export class BookingRepository implements IBookingRepository {
  async getServices(tenantId?: string): Promise<Service[]> {
    let query = supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Error fetching services: ${error.message}`);
    return data as Service[];
  }

  async getBarbers(tenantId?: string): Promise<Barber[]> {
    let query = supabase
      .from('barbers')
      .select('*')
      .order('name', { ascending: true });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Error fetching barbers: ${error.message}`);
    return data as Barber[];
  }

  async getAvailability(dayOfWeek: number, barberId: string): Promise<Availability[]> {
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('barber_id', barberId)
      .eq('is_active', true);

    if (error) throw new Error(`Error fetching availability: ${error.message}`);
    return data as Availability[];
  }

  async getBookedAppointments(date: string, barberId: string): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('date', date)
      .eq('barber_id', barberId)
      .in('status', ['pending', 'confirmed']); // Only active appointments

    if (error) throw new Error(`Error fetching appointments: ${error.message}`);
    return data as Appointment[];
  }

  async createAppointment(bookingData: BookingFormInput): Promise<Appointment> {
    // Basic Input Sanitization
    const clientName = bookingData.clientName.trim();
    const phone = bookingData.phone.replace(/[^0-9+]/g, ''); // Keep only numbers and +

    if (!clientName || !phone) {
      throw new Error('Name and phone are required and must be valid.');
    }

    // 1. Obtener tenant_id (MVP asume 1 tenant, pero buscamos el primero disponible)
    const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single();
    if (!tenant) throw new Error('No tenant found for this booking.');

    // 2. Llamar a la función RPC segura
    const { data, error } = await supabase.rpc('create_booking', {
      p_tenant_id: tenant.id,
      p_service_id: bookingData.serviceId,
      p_barber_id: bookingData.barberId,
      p_date: bookingData.date,
      p_time: bookingData.time,
      p_client_name: clientName,
      p_phone: phone
    });

    if (error) {
      // Handle Postgres unique constraint violation for double booking
      if (error.code === '23505') {
        throw new Error('This time slot is already booked. Please choose another one.');
      }
      throw new Error(`Error creating appointment: ${error.message}`);
    }
    
    // MOCK SERVERLESS
    setTimeout(() => {
        toast.success(`MOCK SERVERLESS: Correo de confirmación encolado para ${phone}`);
    }, 1500); // Simulando delay de Webhook -> Edge Function

    return data as Appointment;
  }
}

export const bookingRepository = new BookingRepository();
