import type { Appointment, Service } from '../../types';

export interface IAdminRepository {
  /**
   * Obtiene todas las citas para una fecha específica.
   */
  getAppointmentsByDate(date: string): Promise<Appointment[]>;

  /**
   * Actualiza el estado de una cita existente.
   */
  updateAppointmentStatus(id: string, status: 'pending' | 'confirmed' | 'cancelled'): Promise<void>;

  /**
   * Obtiene todos los servicios disponibles (activos o inactivos, si se manejara estado, por ahora todos).
   */
  getAllServices(): Promise<Service[]>;

  /**
   * Crea un nuevo servicio en la base de datos.
   */
  createService(service: Omit<Service, 'id' | 'created_at'>): Promise<Service>;

  /**
   * Actualiza los detalles de un servicio existente.
   */
  updateService(id: string, service: Partial<Omit<Service, 'id' | 'created_at'>>): Promise<Service>;

  /**
   * Elimina un servicio de la base de datos.
   */
  deleteService(id: string): Promise<void>;
}
