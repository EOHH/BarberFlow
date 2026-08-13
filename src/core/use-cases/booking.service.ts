import type { IBookingRepository } from '../interfaces/booking.repository.interface';
import { toZonedTime, format } from 'date-fns-tz';

const TIMEZONE = 'America/Lima';

export class BookingService {
  private readonly repository: IBookingRepository;

  constructor(repository: IBookingRepository) {
    this.repository = repository;
  }

  /**
   * Generates available time slots for a given date and service duration.
   */
  async getAvailableSlots(date: string, serviceDurationMinutes: number, barberId: string): Promise<string[]> {
    // 1. Determine day of week (0 = Sunday, 1 = Monday, etc.)
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();

    // 2. Fetch availability (working hours) and existing appointments
    const [availabilities, bookedAppointments] = await Promise.all([
      this.repository.getAvailability(dayOfWeek, barberId),
      this.repository.getBookedAppointments(date, barberId)
    ]);

    if (!availabilities || availabilities.length === 0) {
      return []; // Shop is closed on this day
    }

    const availableSlots: string[] = [];
    
    // Strict America/Lima Timezone Enforcing
    const now = new Date();
    const limaTime = toZonedTime(now, TIMEZONE);
    const limaTodayStr = format(limaTime, 'yyyy-MM-dd');
    
    const isToday = date === limaTodayStr;
    const currentMinutes = isToday ? limaTime.getHours() * 60 + limaTime.getMinutes() : 0;

    // Set of booked times (in minutes from start of day) for quick lookup
    // Since duration might overlap, we need to mark all minutes that are booked
    // A simpler approach for standard slots is just removing the exact start times,
    // but a robust approach checks for overlapping intervals.
    
    // Fetch services to get exact duration of booked appointments
    const services = await this.repository.getServices();
    
    // Convert booked appointments into minute intervals using actual service duration
    const bookedIntervals = bookedAppointments.map(app => {
      const startMins = this.timeToMinutes(app.time);
      const service = services.find(s => s.id === app.service_id);
      const duration = service ? service.duration_minutes : 30; // fallback
      return { start: startMins, end: startMins + duration };
    });

    for (const availability of availabilities) {
      const startMins = this.timeToMinutes(availability.start_time);
      const endMins = this.timeToMinutes(availability.end_time);

      // STEP BY SERVICE DURATION
      for (let time = startMins; time + serviceDurationMinutes <= endMins; time += serviceDurationMinutes) {
        // If it's today, filter out past times (add a 30 min buffer)
        if (isToday && time <= currentMinutes + 30) {
          continue;
        }

        // Check if this time slot overlaps with any booked appointment
        const slotEnd = time + serviceDurationMinutes;
        const isOverlapping = bookedIntervals.some(booked => 
           (time >= booked.start && time < booked.end) || 
           (slotEnd > booked.start && slotEnd < booked.end) ||
           (time <= booked.start && slotEnd >= booked.end)
        );

        // Also check if the exact time is booked (to respect the DB unique constraint)
        const exactMatch = bookedAppointments.some(app => this.timeToMinutes(app.time) === time);

        if (!isOverlapping && !exactMatch) {
          availableSlots.push(this.minutesToTime(time));
        }
      }
    }

    return availableSlots;
  }

  private timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}:00`;
  }
}
