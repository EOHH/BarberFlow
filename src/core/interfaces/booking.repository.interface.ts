import type { Appointment, BookingFormInput } from '../../types';

export interface IBookingRepository {
  getAvailableSlots(slug: string, serviceId: string, barberId: string, date: string): Promise<string[]>;
  createAppointment(bookingData: BookingFormInput): Promise<Appointment>;
}
