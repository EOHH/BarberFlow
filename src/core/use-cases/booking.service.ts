import type { IBookingRepository } from '../interfaces/booking.repository.interface';
import { toZonedTime, format } from 'date-fns-tz';

const TIMEZONE = 'America/Lima';

export class BookingService {
  private readonly repository: IBookingRepository;

  constructor(repository: IBookingRepository) {
    this.repository = repository;
  }

  /**
   * Obtiene los horarios disponibles delegando el cálculo seguro a PostgreSQL.
   */
  async getAvailableSlots(slug: string, serviceId: string, barberId: string, date: string): Promise<string[]> {
    // La RPC `get_available_slots` se encarga de todo el aislamiento Multi-Tenant y
    // la validación de solapamiento de forma ACID transaccional.
    return await this.repository.getAvailableSlots(slug, serviceId, barberId, date);
  }
}
