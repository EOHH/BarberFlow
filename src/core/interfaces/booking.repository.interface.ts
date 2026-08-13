import type { Service, Availability, Appointment, BookingFormInput, Barber } from '../../types';

export interface IBookingRepository {
  getServices(tenantId?: string): Promise<Service[]>;
  getBarbers(tenantId?: string): Promise<Barber[]>;
  getAvailability(dayOfWeek: number, barberId: string): Promise<Availability[]>;
  getBookedAppointments(date: string, barberId: string): Promise<Appointment[]>;
  createAppointment(bookingData: BookingFormInput): Promise<Appointment>;
}
