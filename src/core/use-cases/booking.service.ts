import type { IBookingRepository } from '../interfaces/booking.repository.interface';
import type { TimeSlot } from '../../types';

export class BookingService {
  private readonly repository: IBookingRepository;

  constructor(repository: IBookingRepository) {
    this.repository = repository;
  }

  /**
   * Obtiene los horarios disponibles delegando el cálculo seguro a PostgreSQL.
   */
  async getAvailableSlots(slug: string, serviceId: string, barberId: string, date: string): Promise<TimeSlot[]> {
    // La RPC `get_available_slots` se encarga de todo el aislamiento Multi-Tenant y
    // la validación de solapamiento de forma ACID transaccional.
    return await this.repository.getAvailableSlots(slug, serviceId, barberId, date);
  }
}
