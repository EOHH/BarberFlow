import { useQuery } from '@tanstack/react-query';
import { adminRepository } from '../../infrastructure/supabase/repositories/admin.repository';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { subDays, addDays, startOfDay, endOfDay } from 'date-fns';

const TIME_ZONE = 'America/Lima';

export function useDashboardMetrics() {
  const queryKey = ['dashboard-metrics'];

  const { data: appointments = [], isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => {
      // Calcular ventana: (Hoy - 30 días) hasta (Hoy + 5 días)
      // Ajustamos esto porque el dashboard calcula también métricas mensuales
      // pero para evitar excesivos datos limitaremos a -30 días
      const now = new Date();
      const zonedNow = toZonedTime(now, TIME_ZONE);
      
      const endDateStr = formatInTimeZone(endOfDay(addDays(zonedNow, 5)), TIME_ZONE, 'yyyy-MM-dd');
      const startDateStr = formatInTimeZone(startOfDay(subDays(zonedNow, 30)), TIME_ZONE, 'yyyy-MM-dd');
      
      return adminRepository.getAppointmentsByDateRange(startDateStr, endDateStr);
    },
  });

  return {
    appointments,
    isLoading,
    isError,
    error,
  };
}
