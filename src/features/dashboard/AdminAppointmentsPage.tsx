import { useState, useMemo, useEffect } from 'react';
import { useAdminAppointments } from '../../shared/hooks/useAdminAppointments';
import { useServicesAdmin } from '../../shared/hooks/useServicesAdmin';
import { useStaffAdmin } from '../../shared/hooks/useStaffAdmin';
import { useTenantSettings } from '../../shared/hooks/useTenantSettings';
import { Calendar as CalendarIcon, Phone, User, CheckCircle2, XCircle, Clock4, ChevronLeft, ChevronRight, MessageCircle, X } from 'lucide-react';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { addDays, subDays, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Appointment } from '../../types';
import { getThemeClasses } from '../../shared/utils/theme';
import {
  EXPIRED_STATUS_ACCENT_CLASS,
  EXPIRED_STATUS_BADGE_CLASS,
  EXPIRED_STATUS_SURFACE_CLASS,
} from '../../shared/utils/appointmentStatusStyles';

const TIME_ZONE = 'America/Lima';
const START_HOUR = 8; // 08:00 AM
const END_HOUR = 22;  // 10:00 PM
const PIXELS_PER_MINUTE = 2; // 120px per hour
const GRID_HEIGHT = (END_HOUR - START_HOUR) * 60 * PIXELS_PER_MINUTE;

function timeToMinutes(timeString: string) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTimeAMPM(timeString: string) {
  const [h, m] = timeString.split(':');
  const d = new Date();
  d.setHours(Number(h), Number(m));
  return format(d, 'hh:mm a');
}

export function AdminAppointmentsPage() {
  const [dateObj, setDateObj] = useState(() => toZonedTime(new Date(), TIME_ZONE));
  const dateStr = formatInTimeZone(dateObj, TIME_ZONE, 'yyyy-MM-dd');

  const { appointments, isLoading: isLoadingAppointments, updateStatus } = useAdminAppointments(dateStr);
  const { services, isLoading: isLoadingServices } = useServicesAdmin();
  const { barbers, isLoading: isLoadingBarbers } = useStaffAdmin();

  const { tenant } = useTenantSettings();
  const themeClasses = getThemeClasses(tenant?.theme_color);

  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedAppt) {
      const updatedAppt = appointments.find(a => a.id === selectedAppt.id);
      if (updatedAppt && updatedAppt.status !== selectedAppt.status) {
        setSelectedAppt(updatedAppt);
      }
    }
  }, [appointments]);
  const handlePrevDay = () => setDateObj(prev => subDays(prev, 1));
  const handleNextDay = () => setDateObj(prev => addDays(prev, 1));

  const handleUpdateStatus = async (id: string, status: Appointment['status']) => {
    try {
      await updateStatus({ id, status });
      if (selectedAppt && selectedAppt.id === id) {
        setSelectedAppt({ ...selectedAppt, status });
      }
    } catch (e) {
      // Error handled by hook
    }
  };

  const isLoading = isLoadingAppointments || isLoadingServices || isLoadingBarbers;
  const displayDate = formatInTimeZone(dateObj, TIME_ZONE, "EEEE, d 'de' MMMM, yyyy", { locale: es });

  // Current Time State for Indicator
  const [currentTime, setCurrentTime] = useState(() => toZonedTime(new Date(), TIME_ZONE));
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(toZonedTime(new Date(), TIME_ZONE));
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const isToday = isSameDay(dateObj, toZonedTime(new Date(), TIME_ZONE));
  const currentHourNum = currentTime.getHours();
  const currentMinNum = currentTime.getMinutes();
  const currentTotalMins = currentHourNum * 60 + currentMinNum;
  const currentTimeTopPosition = (currentTotalMins - (START_HOUR * 60)) * PIXELS_PER_MINUTE;

  // Generate hours array [8, 9, 10, ... 21]
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  // Generate 30-min time slots for mobile timeline
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
      const hourStr = h.toString().padStart(2, '0');
      slots.push(`${hourStr}:00:00`);
      slots.push(`${hourStr}:30:00`);
    }
    return slots;
  }, []);

  // Group appointments by barber
  const appointmentsByBarber = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    barbers.forEach(b => map.set(b.id, [])); // Initialize for all barbers
    appointments.forEach(app => {
      if (app.barber_id) {
        if (!map.has(app.barber_id)) map.set(app.barber_id, []);
        map.get(app.barber_id)!.push(app);
      }
    });
    return map;
  }, [appointments, barbers]);

  const getWhatsAppUrl = (phone: string, clientName: string, serviceName: string, time: string) => {
    const formattedPhone = phone.replace(/\D/g, ''); // Solo números
    const formattedTime = formatTimeAMPM(time);
    const message = `Hola ${clientName}, te escribimos de la barbería para confirmar tu cita de ${serviceName} para hoy a las ${formattedTime}. ¡Te esperamos!`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Header and Date Navigation */}
      <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-[24px] p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Calendario</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1 font-medium capitalize">{displayDate}</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#0a0a0a] p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-inner">
          <button 
            onClick={handlePrevDay}
            className="p-3 hover:bg-slate-200 dark:hover:bg-zinc-800/80 rounded-xl transition-colors active:scale-95 text-slate-700 dark:text-zinc-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 px-4 font-bold min-w-[140px] justify-center text-sm text-slate-900 dark:text-white">
            <CalendarIcon className={`w-4 h-4 ${themeClasses.text}`} />
            <span>
              {formatInTimeZone(dateObj, TIME_ZONE, "dd MMM", { locale: es }).toUpperCase()}
            </span>
          </div>

          <button 
            onClick={handleNextDay}
            className="p-3 hover:bg-slate-200 dark:hover:bg-zinc-800/80 rounded-xl transition-colors active:scale-95 text-slate-700 dark:text-zinc-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Desktop Grid Calendar Container */}
      <div className="hidden md:flex bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-[24px] shadow-sm overflow-hidden flex-col">
        {isLoading ? (
          <div className="flex h-[60vh] items-center justify-center">
            <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${themeClasses.border}`}></div>
          </div>
        ) : (
          <div className="flex flex-col h-[70vh] overflow-hidden">
            {/* Headers (Barbers) */}
            <div className="flex border-b border-slate-200 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-[#0a0a0a]/50 sticky top-0 z-20">
              <div className="w-20 shrink-0 border-r border-slate-200 dark:border-zinc-800/50 bg-white/50 dark:bg-[#141414]/50"></div>
              {barbers.map(barber => (
                <div key={barber.id} className="flex-1 min-w-[200px] border-r border-slate-200 dark:border-zinc-800/50 p-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    {barber.avatar_url ? (
                      <img src={barber.avatar_url} alt={barber.name} className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200 dark:border-zinc-700" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full ${themeClasses.bgLight} flex items-center justify-center ${themeClasses.text} font-bold`}>
                        {barber.name.charAt(0)}
                      </div>
                    )}
                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate w-full">{barber.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Time Grid (Scrollable) */}
            <div className="flex-1 overflow-y-auto overflow-x-auto relative scrollbar-hide">
              <div className="flex" style={{ height: GRID_HEIGHT, minWidth: `calc(5rem + ${barbers.length * 200}px)` }}>
                
                {/* Time Column */}
                <div className="w-20 shrink-0 border-r border-slate-200 dark:border-zinc-800/50 bg-white dark:bg-[#141414] relative z-10">
                  {hours.map(hour => (
                    <div 
                      key={hour} 
                      className="absolute w-full flex justify-center -mt-3"
                      style={{ top: (hour - START_HOUR) * 60 * PIXELS_PER_MINUTE }}
                    >
                      <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 bg-white dark:bg-[#141414] px-1">
                        {formatTimeAMPM(`${hour}:00:00`)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Current Time Indicator Line */}
                {isToday && currentHourNum >= START_HOUR && currentHourNum < END_HOUR && (
                  <div 
                    className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                    style={{ top: currentTimeTopPosition }}
                  >
                    <div className={`w-20 shrink-0 flex justify-center -mt-3`}>
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${themeClasses.bg} text-white shadow-md z-30`}>
                         {format(currentTime, 'hh:mm a')}
                       </span>
                    </div>
                    <div className={`flex-1 border-t-[1.5px] ${themeClasses.border} shadow-[0_0_8px_rgba(234,179,8,0.3)] relative`}>
                      <div className={`absolute -right-1 -top-[5px] w-2.5 h-2.5 rounded-full ${themeClasses.bg} shadow-md`}></div>
                    </div>
                  </div>
                )}

                {/* Barber Columns */}
                {barbers.map((barber, index) => {
                  const barberAppts = appointmentsByBarber.get(barber.id) || [];
                  return (
                    <div key={barber.id} className={`flex-1 relative min-w-[200px] ${index !== barbers.length - 1 ? 'border-r border-slate-200 dark:border-zinc-800/50' : ''}`}>
                      {/* Grid Lines */}
                      {hours.map(hour => (
                        <div 
                          key={hour} 
                          className="absolute w-full border-t border-slate-200/50 dark:border-zinc-800/30"
                          style={{ top: (hour - START_HOUR) * 60 * PIXELS_PER_MINUTE }}
                        />
                      ))}
                      
                      {/* Half-hour Lines */}
                      {hours.map(hour => (
                        <div 
                          key={`${hour}-half`} 
                          className="absolute w-full border-t border-slate-200/30 dark:border-zinc-800/20 border-dashed"
                          style={{ top: ((hour - START_HOUR) * 60 + 30) * PIXELS_PER_MINUTE }}
                        />
                      ))}

                      {/* Appointments */}
                      {barberAppts.map(app => {
                        const service = services.find(s => s.id === app.service_id);
                        const duration = service?.duration_minutes || 30;
                        const mins = timeToMinutes(app.time);
                        const top = (mins - (START_HOUR * 60)) * PIXELS_PER_MINUTE;
                        const height = duration * PIXELS_PER_MINUTE;
                        
                        const isCancelled = app.status === 'cancelled';
                        const isCompleted = app.status === 'completed';
                        const isConfirmed = app.status === 'confirmed';
                        const isInProgress = app.status === 'in_progress';
                        const isExpired = app.status === 'expired';

                        return (
                          <div 
                            key={app.id}
                            onClick={() => setSelectedAppt(app)}
                            className={`absolute left-1 right-1 rounded-xl p-1.5 px-2 cursor-pointer shadow-sm border transition-all hover:scale-[1.01] hover:shadow-md overflow-hidden flex flex-col justify-center ${
                              isCancelled 
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300 grayscale opacity-70' 
                                : isCompleted
                                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-800 dark:text-indigo-300'
                                : isInProgress
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300 animate-pulse'
                                : isConfirmed
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                : isExpired
                                ? EXPIRED_STATUS_SURFACE_CLASS
                                : `${themeClasses.bgLight} border-black/5 dark:border-white/5 ${themeClasses.text}`
                            }`}
                            style={{ top, height }}
                          >
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="text-[9px] font-black uppercase tracking-wider opacity-80 leading-none">
                                {formatTimeAMPM(app.time)}
                              </span>
                              {(isConfirmed || isCompleted) && <CheckCircle2 className="w-3 h-3 opacity-70" />}
                            </div>
                            <span className="font-bold text-xs leading-tight truncate">
                              {app.client_name}
                            </span>
                            {height > 40 && (
                              <span className="text-[10px] font-medium opacity-80 truncate mt-0.5 leading-none">
                                {service?.name || 'Servicio'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Premium Timeline View */}
      <div className="md:hidden flex flex-col space-y-6">
        
        {/* Barber Filter (Horizontal Scroll) */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
          <button
            onClick={() => setSelectedBarberId(null)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm border ${
              selectedBarberId === null 
                ? `${themeClasses.bg} text-white border-transparent scale-105` 
                : 'bg-white dark:bg-[#1a1a1a] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
            }`}
          >
            Todos
          </button>
          {barbers.map(barber => (
            <button
              key={barber.id}
              onClick={() => setSelectedBarberId(barber.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-2 py-1.5 pr-4 rounded-full font-bold text-sm transition-all shadow-sm border ${
                selectedBarberId === barber.id
                  ? `${themeClasses.bg} text-white border-transparent scale-105` 
                  : 'bg-white dark:bg-[#1a1a1a] text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
              }`}
            >
              {barber.avatar_url ? (
                <img src={barber.avatar_url} alt={barber.name} className="w-8 h-8 rounded-full object-cover border-2 border-white/20" />
              ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold bg-black/10 dark:bg-white/10 ${themeClasses.text}`}>
                  {barber.name.charAt(0)}
                </div>
              )}
              {barber.name}
            </button>
          ))}
        </div>

        {/* Vertical Timeline */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${themeClasses.border}`}></div>
          </div>
        ) : (
          <div className="space-y-4">
            {!selectedBarberId ? (
              // Vista de "Todos" (Lista simple)
              <>
                {appointments
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map(app => {
                    const service = services.find(s => s.id === app.service_id);
                    const barber = barbers.find(b => b.id === app.barber_id);
                    
                    const isCancelled = app.status === 'cancelled';
                    const isCompleted = app.status === 'completed';
                    const isConfirmed = app.status === 'confirmed';
                    const isInProgress = app.status === 'in_progress';
                    const isExpired = app.status === 'expired';

                    let statusColor = 'bg-slate-500';
                    if (isCancelled) statusColor = 'bg-rose-500';
                    if (isCompleted) statusColor = 'bg-indigo-500';
                    if (isInProgress) statusColor = 'bg-amber-500 animate-pulse';
                    if (isConfirmed) statusColor = 'bg-emerald-500';
                    if (isExpired) statusColor = EXPIRED_STATUS_ACCENT_CLASS;

                    return (
                      <div 
                        key={app.id}
                        onClick={() => setSelectedAppt(app)}
                        className={`relative bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-2xl p-4 shadow-sm flex gap-4 active:scale-[0.98] transition-transform overflow-hidden ${isCancelled ? 'opacity-60 grayscale' : ''}`}
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusColor}`}></div>
                        <div className="flex flex-col items-center justify-center min-w-[70px] border-r border-slate-100 dark:border-zinc-800/50 pr-4 pl-1">
                          <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
                            {formatTimeAMPM(app.time).split(' ')[0]}
                          </span>
                          <span className="text-xs font-bold text-slate-400 uppercase mt-1">
                            {formatTimeAMPM(app.time).split(' ')[1]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex justify-between items-start mb-0.5">
                            <h4 className="font-bold text-base text-slate-900 dark:text-white truncate pr-2">{app.client_name}</h4>
                            {(isConfirmed || isCompleted) && <CheckCircle2 className={`w-4 h-4 shrink-0 ${isCompleted ? 'text-indigo-500' : 'text-emerald-500'}`} />}
                          </div>
                          <p className="text-sm text-slate-500 dark:text-zinc-400 truncate">{service?.name || 'Servicio'}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              {barber?.avatar_url ? (
                                <img src={barber.avatar_url} alt={barber.name} className="w-5 h-5 rounded-full object-cover" />
                              ) : (
                                <div className={`w-5 h-5 rounded-full ${themeClasses.bgLight} ${themeClasses.text} flex items-center justify-center text-[10px] font-bold`}>{barber?.name?.charAt(0) || '?'}</div>
                              )}
                              <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 truncate max-w-[100px]">{barber?.name || 'Sin asignar'}</span>
                            </div>
                            <span className={`text-xs font-black ${themeClasses.text}`}>S/ {service?.price?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      </div>
                    );
                })}
                {appointments.length === 0 && (
                  <div className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                    <CalendarIcon className="w-10 h-10 text-slate-300 dark:text-zinc-700 mb-3" />
                    <p className="text-slate-500 dark:text-zinc-400 font-medium">No hay citas para mostrar</p>
                  </div>
                )}
              </>
            ) : (
              // Vista de Agenda por Barbero (Time Slots Grid)
              <div className="space-y-2">
                {timeSlots.map(timeStr => {
                  const slotMins = timeToMinutes(timeStr);
                  const appt = appointments.find(a => a.barber_id === selectedBarberId && a.time === timeStr);
                  
                  // Verificar si este slot está cubierto por una cita previa
                  const isCovered = appointments.some(a => {
                    if (a.barber_id !== selectedBarberId) return false;
                    const aStart = timeToMinutes(a.time);
                    const svc = services.find(s => s.id === a.service_id);
                    const aEnd = aStart + (svc?.duration_minutes || 30);
                    return slotMins > aStart && slotMins < aEnd;
                  });

                  if (isCovered) return null; // Ocultar bloque si está bajo otra cita

                  const formattedTime = formatTimeAMPM(timeStr).split(' ')[0];

                  if (appt) {
                    const service = services.find(s => s.id === appt.service_id);
                    const isCancelled = appt.status === 'cancelled';
                    const isCompleted = appt.status === 'completed';
                    const isConfirmed = appt.status === 'confirmed';
                    const isInProgress = appt.status === 'in_progress';
                    const isExpired = appt.status === 'expired';

                    // Colores sólidos según el screenshot del cliente
                    let bgClass = 'bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-slate-200';
                    if (isCancelled) bgClass = 'bg-rose-500 text-white';
                    if (isCompleted) bgClass = 'bg-[#6abf69] text-white'; // Verde tipo confirmación
                    if (isInProgress) bgClass = 'bg-amber-500 text-white animate-pulse';
                    if (isConfirmed) bgClass = 'bg-[#6b75c8] text-white'; // Morado/Azul tipo pendiente en su foto
                    if (appt.status === 'pending') bgClass = 'bg-slate-400 text-white'; // Gris oscuro para pendiente sin confirmar
                    if (isExpired) bgClass = EXPIRED_STATUS_SURFACE_CLASS;

                    return (
                      <div 
                        key={timeStr}
                        onClick={() => setSelectedAppt(appt)}
                        className={`rounded-2xl p-4 shadow-md flex items-center gap-4 active:scale-[0.98] transition-transform overflow-hidden cursor-pointer ${bgClass} ${isCancelled ? 'opacity-60 grayscale' : ''}`}
                      >
                        <div className="min-w-[50px]">
                          <span className="text-lg font-black leading-none">{formattedTime}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center text-center border-l border-white/20 pl-4">
                          <span className="font-bold text-base leading-tight truncate w-full">{appt.client_name}</span>
                          <span className="text-sm opacity-90 truncate w-full">{service?.name || 'Servicio'}</span>
                          <div className="text-xs font-bold mt-1 flex items-center justify-center gap-1">
                            {isCompleted ? '✓ Completado' : isConfirmed ? '⏳ Confirmada' : isInProgress ? '🔄 En atención' : isCancelled ? '✕ Cancelada' : isExpired ? 'Expirada' : 'Pendiente de confirmación'}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Slot Vacío
                  return (
                    <div 
                      key={timeStr}
                      className="rounded-2xl bg-slate-100 dark:bg-[#1a1a1a] p-4 flex items-center gap-4 shadow-sm border border-slate-200/50 dark:border-zinc-800"
                    >
                      <div className="min-w-[50px]">
                        <span className="text-lg font-black text-slate-800 dark:text-white leading-none">{formattedTime}</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center border-l border-slate-200 dark:border-zinc-800 pl-4">
                        <button className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slide-over Drawer for Appointment Details */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedAppt(null)}
          />
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-white dark:bg-[#0a0a0a] h-full shadow-2xl border-l border-slate-200 dark:border-zinc-800 flex flex-col animate-in slide-in-from-right-full duration-300">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-zinc-800/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detalles de Cita</h2>
              <button 
                onClick={() => setSelectedAppt(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800/80 rounded-full transition-colors text-slate-500 dark:text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Client Info */}
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full ${themeClasses.bgLight} flex items-center justify-center ${themeClasses.text} font-bold text-xl`}>
                  {selectedAppt.client_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">{selectedAppt.client_name}</h3>
                  <a href={`tel:${selectedAppt.phone}`} className="text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-1 hover:text-emerald-500 transition-colors">
                    <Phone className="w-4 h-4" />
                    {selectedAppt.phone}
                  </a>
                </div>
              </div>

              {/* Appointment Info Card */}
              <div className="bg-slate-50 dark:bg-[#141414] rounded-2xl p-5 border border-slate-200 dark:border-zinc-800/50 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-zinc-800/50 pb-3">
                  <span className="text-sm text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" /> Fecha
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatInTimeZone(new Date(selectedAppt.date + 'T' + selectedAppt.time), TIME_ZONE, "dd/MM/yyyy")}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-zinc-800/50 pb-3">
                  <span className="text-sm text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                    <Clock4 className="w-4 h-4" /> Hora
                  </span>
                  <span className={`font-bold ${themeClasses.text}`}>
                    {formatTimeAMPM(selectedAppt.time)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-zinc-800/50 pb-3">
                  <span className="text-sm text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-2">
                    <User className="w-4 h-4" /> Barbero
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {barbers.find(b => b.id === selectedAppt.barber_id)?.name || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 dark:text-zinc-400 font-medium">Estado</span>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase border ${
                    selectedAppt.status === 'completed' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' :
                    selectedAppt.status === 'in_progress' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse' :
                    selectedAppt.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                    selectedAppt.status === 'cancelled' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                    selectedAppt.status === 'expired' ? EXPIRED_STATUS_BADGE_CLASS :
                    'bg-slate-500/10 text-slate-600 border-slate-500/20'
                  }`}>
                    {selectedAppt.status === 'completed' ? 'Completado' :
                     selectedAppt.status === 'in_progress' ? 'En atención' :
                     selectedAppt.status === 'pending' ? 'Pendiente de confirmación' :
                     selectedAppt.status === 'confirmed' ? 'Confirmada' :
                     selectedAppt.status === 'expired' ? 'Expirada' : 'Cancelada'}
                  </span>
                </div>
              </div>

              {/* Service Info */}
              {(() => {
                const svc = services.find(s => s.id === selectedAppt.service_id);
                if (!svc) return null;
                return (
                  <div className={`${themeClasses.bgLight} rounded-2xl p-5 border border-black/5 dark:border-white/5 flex justify-between items-center`}>
                    <div>
                      <p className={`text-xs ${themeClasses.text} font-bold uppercase tracking-wider mb-1`}>Servicio</p>
                      <p className="font-bold text-slate-900 dark:text-white">{svc.name}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${themeClasses.text} font-bold uppercase tracking-wider mb-1`}>Precio</p>
                      <p className={`font-black text-lg ${themeClasses.text}`}>S/ {svc.price.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })()}

              {/* CRM Actions */}
              <div className="space-y-3 pt-4">
                <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-4">Comunicación</h4>
                
                <a 
                  href={getWhatsAppUrl(
                    selectedAppt.phone, 
                    selectedAppt.client_name, 
                    services.find(s => s.id === selectedAppt.service_id)?.name || 'su servicio',
                    selectedAppt.time
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white hover:bg-[#20bd5a] px-6 py-4 rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-[#25D366]/20"
                >
                  <MessageCircle className="w-5 h-5" />
                  Contactar Cliente
                </a>
              </div>
            </div>

            {/* Status Actions */}
            <div className="p-6 border-t border-slate-200 dark:border-zinc-800/50 bg-slate-50 dark:bg-[#0a0a0a] grid grid-cols-2 gap-3">
              {(() => {
                const isCancelled = selectedAppt.status === 'cancelled';
                const isCompleted = selectedAppt.status === 'completed';
                const isExpired = selectedAppt.status === 'expired';
                
                if (isCancelled || isCompleted || isExpired) {
                  return null;
                }

                return (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedAppt.id, 'cancelled')}
                      className="flex items-center justify-center gap-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white px-4 py-3 rounded-xl font-bold transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Cancelar cita
                    </button>
                    
                    {selectedAppt.status === 'pending' ? (
                      <button
                        onClick={() => handleUpdateStatus(selectedAppt.id, 'confirmed')}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-colors shadow-md bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Confirmar
                      </button>
                    ) : selectedAppt.status === 'confirmed' ? (
                      <button
                        onClick={() => handleUpdateStatus(selectedAppt.id, 'in_progress')}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-colors shadow-md bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20`}
                      >
                        <Clock4 className="w-4 h-4" /> Atender Ahora
                      </button>
                    ) : selectedAppt.status === 'in_progress' ? (
                      <button
                        onClick={() => handleUpdateStatus(selectedAppt.id, 'completed')}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-colors shadow-md bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20`}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Completar
                      </button>
                    ) : null}
                  </>
                );
              })()}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
