import type { Service, Availability, Appointment, BookingFormInput, Barber } from '../../types';

export interface IBookingRepository {
  getAvailableSlots(slug: string, serviceId: string, barberId: string, date: string): Promise<string[]>;
  createAppointment(bookingData: BookingFormInput): Promise<Appointment>;
}
