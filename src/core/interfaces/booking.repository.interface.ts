import type { Appointment, BookingFormInput, TimeSlot } from '../../types';

export interface IBookingRepository {
  getAvailableSlots(slug: string, serviceId: string, barberId: string, date: string): Promise<TimeSlot[]>;
  createAppointment(bookingData: BookingFormInput): Promise<Appointment>;
}
