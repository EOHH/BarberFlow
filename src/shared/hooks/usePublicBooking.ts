import { useQuery } from '@tanstack/react-query';
import { bookingRepository } from '../../infrastructure/supabase/repositories/booking.repository';
import { BookingService } from '../../core/use-cases/booking.service';

export function usePublicBooking(tenantId?: string, selectedDate?: string, durationMinutes?: number, barberId?: string) {
  const { data: services = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ['public-services', tenantId],
    queryFn: () => bookingRepository.getServices(tenantId),
    enabled: !!tenantId,
  });

  const { data: barbers = [], isLoading: isLoadingBarbers } = useQuery({
    queryKey: ['public-barbers', tenantId],
    queryFn: () => bookingRepository.getBarbers(tenantId),
    enabled: !!tenantId,
  });

  const { data: availableSlots = [], isLoading: isLoadingSlots } = useQuery({
    queryKey: ['public-slots', selectedDate, durationMinutes, barberId],
    queryFn: async () => {
      if (!selectedDate || !durationMinutes || !barberId) return [];
      const bookingService = new BookingService(bookingRepository);
      return bookingService.getAvailableSlots(selectedDate, durationMinutes, barberId);
    },
    enabled: !!selectedDate && !!durationMinutes && !!barberId,
  });

  return {
    services,
    barbers,
    availableSlots,
    isLoadingServices,
    isLoadingBarbers,
    isLoadingSlots,
  };
}
