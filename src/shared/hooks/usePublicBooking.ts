import { useQuery } from '@tanstack/react-query';
import { bookingRepository } from '../../infrastructure/supabase/repositories/booking.repository';
import { BookingService } from '../../core/use-cases/booking.service';
import { usePublicTenant } from './usePublicTenant';

export function usePublicBooking(slug?: string, selectedDate?: string, serviceId?: string, barberId?: string) {
  const { tenantData, isLoading: isLoadingTenant } = usePublicTenant(slug);

  const services = tenantData?.services || [];
  const barbers = tenantData?.barbers || [];
  const availability = tenantData?.availability || [];

  const { data: availableSlots = [], isLoading: isLoadingSlots } = useQuery({
    queryKey: ['public-slots', slug, selectedDate, serviceId, barberId],
    queryFn: async () => {
      if (!selectedDate || !serviceId || !barberId || !slug) return [];
      const bookingService = new BookingService(bookingRepository);
      return bookingService.getAvailableSlots(slug, serviceId, barberId, selectedDate);
    },
    enabled: !!selectedDate && !!serviceId && !!barberId && !!slug,
  });

  return {
    services,
    barbers,
    availability,
    availableSlots,
    isLoadingServices: isLoadingTenant,
    isLoadingBarbers: isLoadingTenant,
    isLoadingSlots,
  };
}
