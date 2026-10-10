import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../infrastructure/supabase/client';
import { Search, Calendar, Scissors, ChevronRight, User, ShieldCheck, Bell, CalendarPlus } from 'lucide-react';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { usePublicTenant } from '../../shared/hooks/usePublicTenant';
import { getThemeClasses } from '../../shared/utils/theme';
import { motion, AnimatePresence } from 'framer-motion';
import { EXPIRED_STATUS_BADGE_CLASS } from '../../shared/utils/appointmentStatusStyles';

const TIME_ZONE = 'America/Lima';

const COUNTRIES = [
  { code: '+51', flag: '🇵🇪', name: 'Perú', length: 9, startsWith: '9', placeholder: '987 654 321' },
  { code: '+52', flag: '🇲🇽', name: 'México', length: 10, placeholder: '55 1234 5678' },
  { code: '+54', flag: '🇦🇷', name: 'Argentina', length: 10, placeholder: '11 1234 5678' },
  { code: '+56', flag: '🇨🇱', name: 'Chile', length: 9, placeholder: '9 1234 5678' },
  { code: '+57', flag: '🇨🇴', name: 'Colombia', length: 10, startsWith: '3', placeholder: '312 345 6789' },
  { code: '+58', flag: '🇻🇪', name: 'Venezuela', length: 10, startsWith: '4', placeholder: '414 123 4567' },
  { code: '+591', flag: '🇧🇴', name: 'Bolivia', length: 8, placeholder: '7123 4567' },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador', length: 9, startsWith: '9', placeholder: '99 123 4567' },
  { code: '+595', flag: '🇵🇾', name: 'Paraguay', length: 9, startsWith: '9', placeholder: '981 123 456' },
  { code: '+598', flag: '🇺🇾', name: 'Uruguay', length: 8, startsWith: '9', placeholder: '91 234 567' },
  { code: '+1', flag: '🇺🇸', name: 'USA', length: 10, placeholder: '202 555 0123' },
  { code: '+34', flag: '🇪🇸', name: 'España', length: 9, startsWith: '6', placeholder: '612 345 678' },
];

export function FindBooking() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(() => sessionStorage.getItem('findBookingPhone') || '');
  const [countryCode, setCountryCode] = useState(() => sessionStorage.getItem('findBookingCountry') || '+51');
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Guardar en sessionStorage cuando cambien
  useEffect(() => {
    sessionStorage.setItem('findBookingPhone', phone);
  }, [phone]);

  useEffect(() => {
    sessionStorage.setItem('findBookingCountry', countryCode);
  }, [countryCode]);

  // Si hay datos cacheados al cargar, buscar automáticamente
  useEffect(() => {
    if (phone && countryCode && !searched) {
      // Simular submit para buscar auto
      const formEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSearch(formEvent);
    }
  }, []);

  const { tenantData } = usePublicTenant(slug);
  const tenant = tenantData?.tenant || { name: slug || 'BarberShop', theme_color: '#000000', logo_url: undefined };
  const theme = getThemeClasses(tenant?.theme_color);

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    
    if (val.length > 0) {
      if (selectedCountry.startsWith && !val.startsWith(selectedCountry.startsWith)) {
        while (val.length > 0 && !val.startsWith(selectedCountry.startsWith)) {
          val = val.substring(1);
        }
      }
      if (val.length > selectedCountry.length) {
        val = val.slice(0, selectedCountry.length);
      }
    }
    
    setPhone(val);
    setError('');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    if (phone.length !== selectedCountry.length) {
      setError(`El número debe tener exactamente ${selectedCountry.length} dígitos.`);
      return;
    }
    
    setLoading(true);
    setError('');
    setSearched(true);
    
    try {
      const searchPhone = `${countryCode}${phone}`;

      const { data: aData, error: aError } = await supabase.rpc('get_appointments_by_phone', {
        p_slug: slug,
        p_phone: searchPhone
      });
        
      if (aError) throw aError;
      setAppointments(aData || []);
      
    } catch {
      setError('Ocurrió un error al buscar tus citas. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full relative flex flex-col items-center bg-[#050505]">
      {/* Main Content */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Left Column (Search Form) */}
          <div className="lg:col-span-4 flex flex-col lg:sticky lg:top-32 h-fit">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className={`inline-flex items-center gap-2 mb-4 text-[10px] font-bold tracking-[0.2em] ${theme.text} uppercase`}>
                + BUSCAR CITAS
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-[1.1] text-white">
                Consulta tus <br className="hidden md:block"/>
                <span className={theme.text}>citas agendadas</span>
              </h1>
              <p className="text-zinc-400 text-base mb-10">
                Ingresa tu número de teléfono y encuentra todas tus citas en segundos.
              </p>

              <div className="bg-[#111] border border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <form onSubmit={handleSearch} className="space-y-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full ${theme.bg} text-black font-bold flex items-center justify-center text-xs shrink-0`}>
                      1
                    </div>
                    <h3 className="text-white font-bold text-sm">Ingresa tu número de teléfono</h3>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1 space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Código de País</label>
                      <div className="relative">
                        <select
                          value={countryCode}
                          onChange={e => {
                            setCountryCode(e.target.value);
                            setPhone('');
                            setError('');
                          }}
                          className="w-full h-12 pl-3 pr-8 bg-[#1a1a1a] border border-zinc-800 rounded-xl focus:outline-none focus:border-zinc-600 text-white appearance-none cursor-pointer text-sm"
                        >
                          {COUNTRIES.map(c => (
                            <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-zinc-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label htmlFor="phone" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Número de Teléfono</label>
                      <div className="relative">
                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={handlePhoneChange}
                          placeholder={selectedCountry.placeholder}
                          className="w-full h-12 pl-10 pr-4 bg-[#1a1a1a] border border-zinc-800 rounded-xl focus:outline-none focus:border-zinc-600 text-white placeholder-zinc-600 text-sm tracking-wide"
                          required
                        />
                        <div className="absolute left-3 top-0 bottom-0 flex items-center justify-center pointer-events-none text-zinc-500">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <motion.p role="alert" aria-live="polite" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-rose-500 text-xs font-medium">
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || phone.length !== selectedCountry.length}
                    className={`w-full h-12 ${theme.bg} ${theme.bgHover} text-[#0a0a0a] rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"/> : <Search className="w-4 h-4"/>}
                    BUSCAR MIS CITAS
                  </button>

                  <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border border-zinc-700 text-zinc-500 font-bold flex items-center justify-center text-xs shrink-0`}>
                        2
                      </div>
                      <h3 className="text-white font-bold text-sm">Resultados de tu búsqueda</h3>
                    </div>
                    {searched && !loading && (
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${appointments.length > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {appointments.length} Citas encontradas
                      </span>
                    )}
                  </div>
                </form>
              </div>

              <div className="mt-6 flex items-start gap-4 p-4 border border-zinc-800/50 rounded-2xl bg-zinc-900/20">
                <ShieldCheck className={`w-6 h-6 shrink-0 ${theme.text}`} />
                <div>
                  <p className="text-sm font-semibold text-white mb-1">Tu información está 100% segura y protegida</p>
                  <p className="text-xs text-zinc-500">Solo tú puedes ver tus citas agendadas.</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column (Results) */}
          <div className="lg:col-span-8 flex flex-col">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              className="flex flex-col h-full"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-zinc-800 pb-4">
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                  Tus citas encontradas
                  {searched && (
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${theme.bg} text-black`}>
                      {appointments.length}
                    </span>
                  )}
                </h2>
                
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select 
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                      className="appearance-none bg-transparent border border-zinc-800 rounded-lg h-9 pl-3 pr-8 text-xs font-medium text-white focus:outline-none focus:border-zinc-600"
                    >
                      <option value="desc" className="bg-[#1a1a1a] text-white">Más recientes</option>
                      <option value="asc" className="bg-[#1a1a1a] text-white">Más antiguas</option>
                    </select>
                    <svg className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              <div className="flex-1 relative">
                <AnimatePresence mode="wait">
                  {!searched ? (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-800 rounded-3xl"
                    >
                      <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-600 mb-4">
                        <Search className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">Busca tus citas</h3>
                      <p className="text-zinc-500 text-sm max-w-sm">
                        Ingresa tu número de teléfono en el panel izquierdo para ver el historial y estado de todas tus reservas.
                      </p>
                    </motion.div>
                  ) : appointments.length === 0 ? (
                    <motion.div 
                      key="no-results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-800 rounded-3xl"
                    >
                      <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-600 mb-4">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">No se encontraron citas</h3>
                      <p className="text-zinc-500 text-sm max-w-sm">
                        No hay ninguna reserva registrada con el número {countryCode} {phone}. Revisa si lo escribiste bien.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {[...appointments].sort((a, b) => {
                        const dateA = new Date(`${a.date}T${a.time}`).getTime();
                        const dateB = new Date(`${b.date}T${b.time}`).getTime();
                        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
                      }).map((app, index) => {
                        const isConfirmed = app.status === 'confirmed';
                        const isPending = app.status === 'pending';
                        const isCancelled = app.status === 'cancelled';
                        const isCompleted = app.status === 'completed';
                        const isInProgress = app.status === 'in_progress';
                        const isExpired = app.status === 'expired';
                        
                        let statusColor = 'bg-zinc-800 text-zinc-400';
                        let statusText = 'Desconocido';
                        
                        if (isConfirmed) {
                          statusColor = 'bg-green-500/20 text-green-400';
                          statusText = 'Confirmada';
                        } else if (isPending) {
                          statusColor = 'bg-yellow-500/20 text-yellow-400';
                          statusText = 'Pendiente de confirmación';
                        } else if (isInProgress) {
                          statusColor = 'bg-amber-500/20 text-amber-500 animate-pulse';
                          statusText = 'En Atención';
                        } else if (isCancelled) {
                          statusColor = 'bg-red-500/20 text-red-400';
                          statusText = 'Cancelada';
                        } else if (isCompleted) {
                          statusColor = 'bg-blue-500/20 text-blue-400';
                          statusText = 'Completada';
                        } else if (isExpired) {
                          statusColor = EXPIRED_STATUS_BADGE_CLASS;
                          statusText = 'Expirada';
                        }

                        // Search for the service to get its image
                        const service = tenantData?.services?.find((s: any) => s.name === app.service_name);
                        const imageUrl = service?.image_url || tenant?.logo_url || "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=200&h=200";

                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={app.id}
                            className="flex flex-col sm:flex-row bg-[#111] border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all group shadow-xl"
                          >
                            <div className="sm:w-48 h-32 sm:h-auto shrink-0 relative overflow-hidden bg-zinc-900 border-r border-zinc-800">
                              <img 
                                src={imageUrl} 
                                alt="Cita" 
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                              />
                            </div>
                            
                            <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center relative">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{formatInTimeZone(toZonedTime(new Date(app.date+'T'+app.time), TIME_ZONE), TIME_ZONE, "EEEE, dd 'de' MMMM yyyy")}</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <h3 className="text-2xl font-black text-white">{formatInTimeZone(toZonedTime(new Date(app.date+'T'+app.time), TIME_ZONE), TIME_ZONE, "hh:mm a")}</h3>
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide w-fit ${statusColor}`}>
                                      {statusText}
                                    </span>
                                  </div>
                                </div>

                                <div className="hidden md:block w-px h-16 bg-zinc-800 mx-4" />

                                <div className="flex-1 grid grid-cols-1 gap-4">
                                  <div className="flex items-center gap-3">
                                    <Scissors className={`w-5 h-5 ${theme.text}`} />
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-white">{app.service_name}</span>
                                      <span className="text-xs text-zinc-500">Servicio</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <User className={`w-5 h-5 ${theme.text}`} />
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-white">{app.barber_name || 'Cualquier Barbero'}</span>
                                      <span className="text-xs text-zinc-500">Barbero</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mt-4 md:mt-0 flex justify-end">
                                  <Link
                                    to={`/booking/${slug}/status/${app.id}`}
                                    className="px-4 py-2 border border-zinc-700 hover:border-zinc-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                                  >
                                    Ver detalles
                                    <ChevronRight className="w-3 h-3" />
                                  </Link>
                                </div>

                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          </div>
        </div>

        {/* Bottom Banners */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Recordatorios */}
          <div className="bg-[#111] border border-zinc-800/80 rounded-3xl p-6 sm:p-8 flex flex-col xl:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-4 text-center xl:text-left">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                <Bell className={`w-5 h-5 ${theme.text}`} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-1">RECORDATORIOS</h4>
                <p className="text-xs text-zinc-500">Recibe notificaciones de tus próximas<br className="hidden xl:block"/> citas y nunca olvides tu horario.</p>
              </div>
            </div>
            <button className={`shrink-0 px-6 py-3 border border-zinc-700 hover:border-${theme.text} ${theme.textHover} rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors`}>
              <Bell className="w-4 h-4" />
              ACTIVAR RECORDATORIOS
            </button>
          </div>

          {/* Nueva Reserva */}
          <div className="bg-[#111] border border-zinc-800/80 rounded-3xl p-6 sm:p-8 flex flex-col xl:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-4 text-center xl:text-left">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                <CalendarPlus className={`w-5 h-5 ${theme.text}`} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-1">¿LISTO PARA TU PRÓXIMA CITA?</h4>
                <p className="text-xs text-zinc-500">Reserva tu próxima experiencia y sigue<br className="hidden xl:block"/> luciendo tu mejor versión.</p>
              </div>
            </div>
            <button 
              onClick={() => {
                // Navigate to root to start booking
                navigate(`/booking/${slug}`);
              }}
              className={`shrink-0 px-6 py-3 border border-zinc-700 hover:border-${theme.text} ${theme.textHover} rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors`}
            >
              RESERVAR AHORA
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Extra Bottom Shield */}
        <div className="mt-8 flex items-center justify-center gap-2 text-zinc-500 opacity-60">
          <ShieldCheck className="w-4 h-4" />
          <p className="text-[10px] sm:text-xs">Tu información está protegida con encriptación de extremo a extremo.</p>
        </div>

      </main>
    </div>
  );
}
