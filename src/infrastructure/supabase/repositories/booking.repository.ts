import { supabase } from '../client';
import type { IBookingRepository } from '../../../core/interfaces/booking.repository.interface';
import type { Appointment, BookingFormInput, TimeSlot } from '../../../types';

export class BookingRepository implements IBookingRepository {
  async getAvailableSlots(slug: string, serviceId: string, barberId: string, date: string): Promise<TimeSlot[]> {
    const { data, error } = await supabase.rpc('get_available_slots', {
      p_slug: slug,
      p_service_id: serviceId,
      p_barber_id: barberId,
      p_date: date
    });

    if (error) {
      throw new Error(`Error al calcular horarios disponibles: ${error.message}`);
    }

    const slots = (data || []) as string[];
    return slots.map(time => ({
      time: time.substring(0, 5), // "09:00"
      available: true
    }));
  }

  async createAppointment(bookingData: BookingFormInput): Promise<Appointment> {
    // Basic Input Sanitization
    const clientName = bookingData.clientName.trim();
    const phone = bookingData.phone.replace(/[^0-9+]/g, ''); // Keep only numbers and +

    if (!clientName || !phone) {
      throw new Error('Name and phone are required and must be valid.');
    }

    if (!bookingData.slug) {
      throw new Error('Slug del tenant no proporcionado.');
    }

    const { data, error } = await supabase.rpc('create_booking', {
      p_slug: bookingData.slug,
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
    
    return {
      id: data?.id,
      date: bookingData.date,
      time: bookingData.time,
      client_name: clientName,
      phone: phone,
      service_id: bookingData.serviceId,
      barber_id: bookingData.barberId,
      status: 'pending'
    } as Appointment;
  }
}

export const bookingRepository = new BookingRepository();
