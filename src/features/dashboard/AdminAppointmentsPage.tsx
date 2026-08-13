import { useState, useMemo } from 'react';
import { useAdminAppointments } from '../../shared/hooks/useAdminAppointments';
import { useServicesAdmin } from '../../shared/hooks/useServicesAdmin';
import { useStaffAdmin } from '../../shared/hooks/useStaffAdmin';
import { Calendar as CalendarIcon, Phone, User, CheckCircle2, XCircle, Clock4, ChevronLeft, ChevronRight, MessageCircle, Mail, X } from 'lucide-react';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { addDays, subDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import type { Appointment } from '../../types';
import { useTenantSettings } from '../../shared/hooks/useTenantSettings';
import { getThemeClasses } from '../../shared/utils/theme';

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

  const handlePrevDay = () => setDateObj(prev => subDays(prev, 1));
  const handleNextDay = () => setDateObj(prev => addDays(prev, 1));

  const handleUpdateStatus = async (id: string, status: 'pending' | 'confirmed' | 'cancelled' | 'completed') => {
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

  // Generate hours array [8, 9, 10, ... 21]
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

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

  const handleEmailMock = () => {
    toast.info('Correo enviado manualmente (Mock)');
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

      {/* Grid Calendar Container */}
      <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-[24px] shadow-sm overflow-hidden flex flex-col">
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

                        return (
                          <div 
                            key={app.id}
                            onClick={() => setSelectedAppt(app)}
                            className={`absolute left-1 right-1 rounded-xl p-3 cursor-pointer shadow-sm border transition-all hover:scale-[1.01] hover:shadow-md overflow-hidden flex flex-col ${
                              isCancelled 
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300 grayscale opacity-70' 
                                : isCompleted
                                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-800 dark:text-indigo-300'
                                : isConfirmed
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                                : `${themeClasses.bgLight} border-black/5 dark:border-white/5 ${themeClasses.text}`
                            }`}
                            style={{ top, height }}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-black uppercase tracking-wider opacity-70">
                                {formatTimeAMPM(app.time)}
                              </span>
                              {(isConfirmed || isCompleted) && <CheckCircle2 className="w-3 h-3 opacity-70" />}
                            </div>
                            <span className="font-bold text-sm leading-tight truncate">
                              {app.client_name}
                            </span>
                            <span className="text-xs opacity-80 truncate mt-1">
                              {service?.name || 'Servicio'}
                            </span>
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
                    selectedAppt.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                    selectedAppt.status === 'cancelled' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 
                    'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  }`}>
                    {selectedAppt.status === 'completed' ? 'Completado' :
                     selectedAppt.status === 'pending' ? 'Pendiente' : 
                     selectedAppt.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
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
                <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-4">Mensajería Manual (CRM)</h4>
                
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
                  Confirmar por WhatsApp
                </a>
                
                <button 
                  onClick={handleEmailMock}
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 px-6 py-4 rounded-xl font-bold transition-all active:scale-95"
                >
                  <Mail className="w-5 h-5" />
                  Enviar Correo Manual
                </button>
              </div>
            </div>

            {/* Status Actions */}
            <div className="p-6 border-t border-slate-200 dark:border-zinc-800/50 bg-slate-50 dark:bg-[#0a0a0a] grid grid-cols-2 gap-3">
              {selectedAppt.status !== 'cancelled' ? (
                <button
                  onClick={() => handleUpdateStatus(selectedAppt.id, 'cancelled')}
                  className="flex items-center justify-center gap-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white px-4 py-3 rounded-xl font-bold transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Cancelar
                </button>
              ) : (
                <button
                  onClick={() => handleUpdateStatus(selectedAppt.id, 'pending')}
                  className="flex items-center justify-center gap-2 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-300 dark:hover:bg-zinc-700 px-4 py-3 rounded-xl font-bold transition-colors"
                >
                  Restaurar
                </button>
              )}
              
              {selectedAppt.status !== 'confirmed' && selectedAppt.status !== 'cancelled' && selectedAppt.status !== 'completed' && (
                <button
                  onClick={() => handleUpdateStatus(selectedAppt.id, 'confirmed')}
                  className="flex items-center justify-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-3 rounded-xl font-bold transition-colors shadow-md shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirmar
                </button>
              )}
              {selectedAppt.status === 'confirmed' && (
                <button
                  onClick={() => handleUpdateStatus(selectedAppt.id, 'completed')}
                  className="flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-3 rounded-xl font-bold transition-colors shadow-md shadow-indigo-500/20 col-span-1"
                >
                  <CheckCircle2 className="w-4 h-4" /> Completado
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
