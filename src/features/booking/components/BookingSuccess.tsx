import type { Appointment, Service } from '../../../types';
import { CheckCircle2, Calendar, Clock, Scissors, Settings2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { ThemeClasses } from '../../../shared/utils/theme';
import type { Tenant } from '../../../types';

interface Props {
  appointment: Appointment;
  service: Service;
  onReset: () => void;
  theme: ThemeClasses;
  tenant: Tenant | any;
}

export function BookingSuccess({ appointment, service, onReset, theme, tenant }: Props) {
  const { slug } = useParams<{ slug: string }>();
  const isConfirmed = appointment.status === 'confirmed';

  const generateGoogleCalendarLink = () => {
    // Google Calendar format: 20260821T153000Z
    // The time is local (Lima). Google Calendar supports local time if Z is omitted, but to be safe we can just format it without Z.
    // Example: 20231231T153000
    const [year, month, day] = appointment.date.split('-');
    const [hour, min, sec] = appointment.time.split(':');
    const startStr = `${year}${month}${day}T${hour}${min}${sec || '00'}`;
    
    // Calculate end time
    const startMins = parseInt(hour) * 60 + parseInt(min);
    const duration = appointment.duration_minutes_snapshot;
    const endMins = startMins + duration;
    const endHour = Math.floor(endMins / 60).toString().padStart(2, '0');
    const endMin = (endMins % 60).toString().padStart(2, '0');
    const endStr = `${year}${month}${day}T${endHour}${endMin}00`;

    const title = encodeURIComponent(`Cita: ${appointment.service_name_snapshot} en ${tenant?.name || 'Barbería'}`);
    const details = encodeURIComponent(
      isConfirmed
        ? `Tu cita para ${appointment.service_name_snapshot} está confirmada.`
        : `Tu solicitud de cita para ${appointment.service_name_snapshot} está pendiente de aprobación por la barbería.`
    );
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`;
  };

  return (
    <div className="flex flex-col items-center text-center p-8 bg-[#141414] rounded-3xl border border-zinc-800 shadow-xl w-full mt-4">
      <div className={`w-24 h-24 rounded-full flex items-center justify-center ${theme.bgLight} ${theme.text} mb-6`}>
        <CheckCircle2 className="w-12 h-12" />
      </div>
      <h2 className="text-3xl font-extrabold mb-3 text-white">
        {isConfirmed ? '¡Cita confirmada!' : '¡Solicitud registrada!'}
      </h2>
      <p className="text-zinc-400 mb-8 text-[15px]">
        {isConfirmed
          ? 'Tu horario quedó reservado y confirmado.'
          : 'Tu cita está pendiente de aprobación por la barbería.'}
      </p>

      <div className="w-full bg-[#0a0a0a] rounded-2xl p-6 mb-8 flex items-center justify-between gap-6 text-left border border-zinc-800 shadow-inner relative overflow-hidden">
        <div className="space-y-5 relative z-10 flex-1">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${theme.bgLight} flex items-center justify-center shrink-0`}>
              <Scissors className={`w-6 h-6 ${theme.text}`} />
            </div>
            <span className="font-bold text-[16px] text-white">{appointment.service_name_snapshot}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${theme.bgLight} flex items-center justify-center shrink-0`}>
              <Calendar className={`w-6 h-6 ${theme.text}`} />
            </div>
            <span className="font-semibold text-[15px] text-zinc-300">{appointment.date}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${theme.bgLight} flex items-center justify-center shrink-0`}>
              <Clock className={`w-6 h-6 ${theme.text}`} />
            </div>
            <span className="font-semibold text-[15px] text-zinc-300">{appointment.time}</span>
          </div>
        </div>

        {service.image_url && (
          <div className="hidden sm:block w-[140px] h-[140px] shrink-0 relative rounded-xl overflow-hidden shadow-lg border border-zinc-800/50">
            <img 
              src={service.image_url} 
              alt={service.name} 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0a0a0a]/40" />
          </div>
        )}
      </div>

      <a
        href={generateGoogleCalendarLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full h-14 bg-white text-[#0a0a0a] font-bold text-[16px] rounded-xl hover:bg-zinc-200 transition-all active:scale-[0.98] mb-3 flex items-center justify-center gap-2 shadow-lg"
      >
        <Calendar className="w-5 h-5" />
        Agregar a mi calendario
      </a>
      
      <Link
        to={`/booking/${slug || tenant?.slug}/status/${appointment?.id}`}
        className="w-full h-14 bg-zinc-800 text-white font-bold text-[16px] rounded-xl hover:bg-zinc-700 transition-all active:scale-[0.98] mb-4 flex items-center justify-center gap-2"
      >
        <Settings2 className="w-5 h-5" />
        Autogestión (Ver estado o Cancelar)
      </Link>
      
      <button
        onClick={onReset}
        className="w-full h-14 bg-[#1a1a1a] border border-zinc-800 text-white font-bold text-[16px] rounded-xl hover:bg-zinc-800 transition-all active:scale-[0.98]"
      >
        Hacer otra reserva
      </button>
    </div>
  );
}
