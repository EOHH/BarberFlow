import { useState, useEffect } from 'react';
import { availabilityRepository } from '../../infrastructure/supabase/repositories/availability.repository';
import type { Availability } from '../../types';

const defaultSchedule = [
  { day_of_week: 1, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
  { day_of_week: 2, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
  { day_of_week: 3, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
  { day_of_week: 4, start_time: '09:00:00', end_time: '18:00:00', is_active: true },
  { day_of_week: 5, start_time: '09:00:00', end_time: '19:00:00', is_active: true },
  { day_of_week: 6, start_time: '09:00:00', end_time: '15:00:00', is_active: true },
  { day_of_week: 0, start_time: '09:00:00', end_time: '18:00:00', is_active: false },
];

export function useAvailabilityAdmin(barberId: string | undefined) {
  const [availabilities, setAvailabilities] = useState<Partial<Availability>[]>(defaultSchedule);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAvailability = async () => {
    if (!barberId) return;
    setIsLoading(true);
    try {
      const data = await availabilityRepository.getAvailabilityByBarber(barberId);
      if (data.length > 0) {
        setAvailabilities(data);
      } else {
        // Init with default schedule if empty
        setAvailabilities(defaultSchedule);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [barberId]);

  const saveAvailability = async (newSchedule: Partial<Availability>[]) => {
    if (!barberId) return;
    try {
      await availabilityRepository.upsertAvailability(barberId, newSchedule as Omit<Availability, 'id' | 'tenant_id'>[]);
      await fetchAvailability();
    } catch (err) {
      throw err;
    }
  };

  return {
    availabilities,
    isLoading,
    saveAvailability
  };
}
