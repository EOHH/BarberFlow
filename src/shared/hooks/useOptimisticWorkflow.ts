import { useEffect, useRef } from 'react';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import type { Appointment, Service } from '../../types';

const TIME_ZONE = 'America/Lima';

function timeToMinutes(timeStr: string) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function useOptimisticWorkflow(
  appointments: Appointment[],
  services: Service[],
  currentDateStr: string,
  updateStatus: (params: { id: string, status: 'pending' | 'confirmed' | 'cancelled' | 'in_progress' | 'completed' }) => Promise<void>
) {
  const appointmentsRef = useRef(appointments);
  const servicesRef = useRef(services);
  const updateStatusRef = useRef(updateStatus);
  const processedRef = useRef<Set<string>>(new Set()); // To avoid spamming updates for the same appointment locally

  useEffect(() => {
    appointmentsRef.current = appointments;
    servicesRef.current = services;
    updateStatusRef.current = updateStatus;
  }, [appointments, services, updateStatus]);

  useEffect(() => {
    // Solo ejecutamos optimismo si la fecha mostrada en la pantalla es HOY.
    const todayStr = formatInTimeZone(new Date(), TIME_ZONE, 'yyyy-MM-dd');
    if (currentDateStr !== todayStr) return;

    const intervalId = setInterval(() => {
      const now = toZonedTime(new Date(), TIME_ZONE);
      const currentTotalMins = now.getHours() * 60 + now.getMinutes();

      appointmentsRef.current.forEach(app => {
        // Ignoramos estados que ya son terminales
        if (app.status === 'cancelled' || app.status === 'completed') return;

        const startMins = timeToMinutes(app.time);
        const service = servicesRef.current.find(s => s.id === app.service_id);
        const duration = service?.duration_minutes || 30;
        const endMins = startMins + duration;

        // Regla 1: Si ya empezó pero no ha terminado -> 'in_progress'
        // Lo aplicamos si está 'pending' o 'confirmed'
        if ((app.status === 'pending' || app.status === 'confirmed') && currentTotalMins >= startMins && currentTotalMins < endMins) {
          const signature = `${app.id}-in_progress`;
          if (!processedRef.current.has(signature)) {
            processedRef.current.add(signature);
            updateStatusRef.current({ id: app.id, status: 'in_progress' }).catch(console.error);
          }
        }
        
        // Regla 2: Si ya pasó su hora de finalización -> 'completed'
        if (currentTotalMins >= endMins) {
          const signature = `${app.id}-completed`;
          if (!processedRef.current.has(signature)) {
            processedRef.current.add(signature);
            updateStatusRef.current({ id: app.id, status: 'completed' }).catch(console.error);
          }
        }
      });
    }, 15000); // Check every 15 seconds

    return () => clearInterval(intervalId);
  }, [currentDateStr]);
}
