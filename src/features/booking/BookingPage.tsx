import { useState } from 'react';
import { usePublicBooking } from '../../shared/hooks/usePublicBooking';
import { ServiceSelection } from './components/ServiceSelection';
import { BarberSelection } from './components/BarberSelection';
import { DateSelection } from './components/DateSelection';
import { TimeSelection } from './components/TimeSelection';
import { BookingForm } from './components/BookingForm';
import { BookingSuccess } from './components/BookingSuccess';
import { bookingRepository } from '../../infrastructure/supabase/repositories/booking.repository';
import type { Service, Appointment, Barber } from '../../types';
import { ChevronLeft } from 'lucide-react';
import { usePublicTenant } from '../../shared/hooks/usePublicTenant';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { getThemeClasses } from '../../shared/utils/theme';

import { useParams } from 'react-router-dom';

export function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [step, setStep] = useState(1);
  const [currentTab, setCurrentTab] = useState<'inicio' | 'servicios'>('inicio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  const { tenantData } = usePublicTenant(slug);
  // Usa tenantData.tenant si está disponible, sino un fallback
  const tenant = tenantData?.tenant || { name: slug || 'BarberShop', theme_color: '#000000', logo_url: undefined };
  const theme = getThemeClasses(tenant?.theme_color);

  // TanStack Query
  const { services, barbers, availableSlots, isLoadingServices, isLoadingBarbers } = usePublicBooking(
    slug,
    selectedDate, 
    selectedService?.id,
    selectedBarber?.id
  );


  const handleNext = () => {
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setStep(s => Math.max(1, s - 1));
  };

  const handleGenericBookClick = () => {
    if (!selectedService) {
      document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
      toast('Selecciona un servicio para comenzar', {
        style: { background: '#0a0a0a', color: '#fff', border: '1px solid #27272a' }
      });
    } else {
      if (step === 1) handleNext();
    }
  };
  const handleReset = () => {
    setSelectedService(null);
    if (barbers.length > 1) {
      setSelectedBarber(null);
    }
    setSelectedDate('');
    setSelectedTime('');
    setCreatedAppointment(null);
    setStep(1);
  };

  const handleBookingSubmit = async (clientName: string, phone: string) => {
    if (!selectedService || !selectedDate || !selectedTime || !selectedBarber) return;
    
    try {
      const appointment = await bookingRepository.createAppointment({
        slug: slug || '',
        serviceId: selectedService.id,
        barberId: selectedBarber.id,
        date: selectedDate,
        time: selectedTime,
        clientName,
        phone
      });
      setCreatedAppointment(appointment);
      setStep(6); // Now it's step 6
    } catch (err: any) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido al crear la cita.';
      toast.error(errorMsg);
    }
  };

  if (isLoadingServices && step === 1) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p className="text-sm font-medium opacity-70">Cargando servicios...</p>
      </div>
    );
  }

  const getStepTitle = () => {
    switch(step) {
      case 1: return "Elige un Servicio";
      case 2: return "Elige un Barbero";
      case 3: return "Selecciona un Día";
      case 4: return "Elige la Hora";
      case 5: return "Tus Datos";
      case 6: return "Confirmación";
      default: return "Reservar";
    }
  };

  return (
    <div className={`w-full min-h-screen flex flex-col font-sans ${theme.selectionBg} bg-[#0a0a0a] text-white`}>
      
      {/* Navbar Premium */}
      <header className={`sticky top-0 z-50 h-20 flex items-center justify-between px-6 lg:px-12 transition-colors bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-800/50 ${
        step > 1 ? 'md:hidden' : ''
      }`}>
        <div className="flex items-center gap-4">
          {step > 1 && step < 6 && (
            <button 
              onClick={handleBack} 
              className={`p-2 -ml-2 rounded-full transition-colors ${
                step === 1 ? 'hover:bg-zinc-800 active:bg-zinc-800' : 'hover:bg-muted active:bg-muted/80'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          
          <div className="flex items-center gap-3">
            {tenant?.logo_url ? (
              <img src={tenant.logo_url} alt="Logo" className="h-10 object-contain" />
            ) : (
              <div className={`w-10 h-10 border ${theme.border} ${theme.text} rounded-full flex items-center justify-center font-bold text-lg shadow-sm`}>
                {tenant?.name?.charAt(0) || 'RC'}
              </div>
            )}
            <h1 className="text-lg font-bold tracking-widest hidden sm:block truncate max-w-[200px]">
              {tenant?.name?.toUpperCase() || 'RC BARBER SHOP'}
            </h1>
          </div>
          
          {step > 1 && step < 6 && (
            <div className="flex flex-col items-center pointer-events-none md:hidden ml-2 sm:ml-4">
              <span className={`text-[10px] sm:text-xs font-bold ${theme.text} tracking-widest uppercase`}>
                {getStepTitle()}
              </span>
            </div>
          )}
        </div>

        {/* Desktop Menu */}
        {step === 1 && (
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setCurrentTab('inicio')}
              className={`text-sm font-medium transition-colors relative ${currentTab === 'inicio' ? theme.text : 'text-zinc-400 hover:text-white'}`}
            >
              Inicio
              {currentTab === 'inicio' && <span className={`absolute -bottom-7 left-0 w-full h-[2px] ${theme.bg}`}></span>}
            </button>
            <button 
              onClick={() => setCurrentTab('servicios')}
              className={`text-sm font-medium transition-colors relative ${currentTab === 'servicios' ? theme.text : 'text-zinc-400 hover:text-white'}`}
            >
              Servicios
              {currentTab === 'servicios' && <span className={`absolute -bottom-7 left-0 w-full h-[2px] ${theme.bg}`}></span>}
            </button>
          </nav>
        )}

        <div className="flex items-center justify-end">
          {step === 1 && (
            <>
              <button onClick={handleGenericBookClick} className={`hidden md:flex items-center gap-2 text-sm font-semibold text-white ${theme.bg} px-5 py-2.5 rounded-md ${theme.bgHover} transition-colors`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Reservar Cita
              </button>
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="md:hidden p-2 text-zinc-300 hover:text-white transition-colors"
              >
                {isMobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && step === 1 && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setIsMobileMenuOpen(false)} 
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-64 h-full bg-[#141414] shadow-2xl flex flex-col border-r border-zinc-800/50"
            >
              <div className="h-20 flex items-center justify-between px-6 border-b border-zinc-800/50">
                <span className={`font-extrabold text-white tracking-widest uppercase`}>Menú</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="flex flex-col p-6 gap-6 overflow-y-auto flex-1">
                <button 
                  onClick={() => {
                    setCurrentTab('inicio');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-lg font-medium text-left transition-colors ${currentTab === 'inicio' ? theme.text : 'text-zinc-400 hover:text-white'}`}
                >
                  Inicio
                </button>
                <button 
                  onClick={() => {
                    setCurrentTab('servicios');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-lg font-medium text-left transition-colors ${currentTab === 'servicios' ? theme.text : 'text-zinc-400 hover:text-white'}`}
                >
                  Servicios
                </button>
                
                <div className="mt-auto pt-6 border-t border-zinc-800/50">
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleGenericBookClick();
                    }} 
                    className={`w-full flex items-center justify-center gap-2 text-base font-semibold text-white ${theme.bg} px-5 py-4 rounded-xl ${theme.bgHover} transition-colors`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Reservar Cita
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col"
            >
              {currentTab === 'inicio' ? (
                /* Hero Section Split Layout (Inicio) */
                <div className="relative w-full overflow-hidden bg-[#0a0a0a]">
                  {/* Desktop Split Image & Mobile Fallback Image */}
                  <div className="absolute inset-0 md:left-1/3 z-0">
                    <div 
                      className="absolute inset-0"
                      style={{ 
                        backgroundImage: `url('/banner-barber.jpg')`,
                        backgroundColor: '#1a1a1a', // Fallback color if image is missing
                        backgroundSize: 'cover',
                        backgroundPosition: 'top right'
                      }}
                    />
                    {/* Masking the image to fade to black on the left and bottom */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent md:from-[#0a0a0a] md:via-[#0a0a0a]/90 md:to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
                  </div>

                  {/* Hero Content */}
                  <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pt-10 pb-8 md:pt-20 md:pb-16">
                    <div className="max-w-2xl text-left">
                      <div className={`inline-flex items-center gap-2 mb-6 text-[10px] sm:text-xs font-bold tracking-[0.2em] ${theme.text} uppercase`}>
                        <span className={`p-1 rounded-full border ${theme.border} ${theme.bgLight}`}><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg></span>
                        ESTILO • CONFIANZA • CALIDAD
                      </div>
                      
                      <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6">
                        Eleva tu estilo en <br className="hidden md:block"/>
                        <span className={theme.text}>{tenant?.name?.toUpperCase() || 'RC BARBER SHOP.'}</span>
                      </h2>
                      
                      <p className="text-zinc-400 text-lg md:text-xl font-medium mb-10 max-w-lg">
                        Reserva tu cita en línea con los mejores profesionales. Rápido, fácil y sin esperas.
                      </p>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <button onClick={handleGenericBookClick} className={`w-full sm:w-auto flex items-center justify-center gap-2 text-white ${theme.bg} px-8 py-4 rounded-md font-semibold ${theme.bgHover} transition-colors`}>
                          Reservar Mi Cita
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </button>
                        <button onClick={() => setCurrentTab('servicios')} className="w-full sm:w-auto flex items-center justify-center gap-2 text-white bg-transparent border border-zinc-700 px-8 py-4 rounded-md font-semibold hover:bg-zinc-800 transition-colors">
                          Ver Servicios
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Hero Section Centered (Services View) */}
                  <div className="relative w-full overflow-hidden bg-[#0a0a0a] pt-10 pb-12 md:pt-20 md:pb-16 flex flex-col items-center justify-center text-center px-4">
                    
                    {/* Background Image & Overlay */}
                    <div 
                      className="absolute inset-0 z-0"
                      style={{ 
                        backgroundImage: `url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop')`, // Barber tools
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <div className="absolute inset-0 z-0 bg-zinc-950/80" />
                    <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-[#0a0a0a]" />

                    {/* Hero Content */}
                    <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
                      <div className={`inline-flex items-center gap-2 mb-6 text-[10px] sm:text-xs font-bold tracking-[0.2em] ${theme.text} uppercase`}>
                        — NUESTROS SERVICIOS —
                      </div>
                      
                      <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6">
                        Servicios que realzan <br className="hidden md:block"/>
                        <span className={theme.text}>tu estilo</span>
                      </h2>
                      
                      <p className="text-zinc-400 text-lg md:text-xl font-medium max-w-xl mx-auto">
                        Descubre nuestra variedad de servicios diseñados para realzar tu mejor versión.
                      </p>
                    </div>
                  </div>

                  {/* Barra de Atributos */}
                  <div className="w-full border-y border-zinc-900 bg-[#0a0a0a]">
                    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-zinc-900">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 md:px-6 pt-4 md:pt-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-900 text-zinc-400 border border-white/5">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                        </div>
                        <div>
                          <p className="text-zinc-200 font-semibold text-[13px] md:text-sm">Profesionales Expertos</p>
                          <p className="text-zinc-500 text-[11px] md:text-xs">Barberos certificados</p>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-4 md:px-6 pt-4 md:pt-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-900 text-zinc-400 border border-white/5">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.45m.31-.31c.02-.104.04-.208.06-.312" /></svg>
                        </div>
                        <div>
                          <p className="text-zinc-200 font-semibold text-[13px] md:text-sm">Productos Premium</p>
                          <p className="text-zinc-500 text-[11px] md:text-xs">Calidad que se nota</p>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-4 md:px-6 pt-4 md:pt-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-900 text-zinc-400 border border-white/5">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                          <p className="text-zinc-200 font-semibold text-[13px] md:text-sm">Citas 100% Online</p>
                          <p className="text-zinc-500 text-[11px] md:text-xs">Rápido y sin complicaciones</p>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-4 md:px-6 pt-4 md:pt-0">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-900 text-zinc-400 border border-white/5">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                          <p className="text-zinc-200 font-semibold text-[13px] md:text-sm">Ambiente Exclusivo</p>
                          <p className="text-zinc-500 text-[11px] md:text-xs">Comodidad y estilo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Contenedor del Catálogo */}
              <div id="services-section" className="w-full bg-[#0a0a0a] pt-4 pb-20 md:pt-8 md:pb-24">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                  
                  <ServiceSelection 
                    services={services}
                    selectedServiceId={selectedService?.id}
                    onSelect={(id) => { 
                      const s = services.find((x: Service) => x.id === id);
                      if (s) {
                        setSelectedService(s); 
                        // Resetear estado posterior para evitar State Leak
                        setSelectedBarber(null);
                        setSelectedDate('');
                        setSelectedTime('');
                        handleNext(); 
                      }
                    }}
                    isLoading={isLoadingServices}
                    theme={theme}
                  />

                  {currentTab === 'servicios' && (
                    <div className="mt-16 bg-[#141414] border border-zinc-800 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-full ${theme.bgLight} flex items-center justify-center shrink-0`}>
                          <svg className={`w-8 h-8 ${theme.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" /></svg>
                        </div>
                        <div>
                          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">¿Listo para tu próximo cambio?</h3>
                          <p className="text-zinc-400">Reserva tu cita ahora y vive la experiencia {tenant?.name || 'RC Barber Shop'}.</p>
                        </div>
                      </div>
                      <button onClick={handleGenericBookClick} className={`w-full md:w-auto shrink-0 flex items-center justify-center gap-2 text-white ${theme.bg} px-8 py-4 rounded-xl font-semibold ${theme.bgHover} transition-colors shadow-lg shadow-black/20`}>
                        Reservar Mi Cita
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Estructural */}
              <footer className="w-full border-t border-zinc-900 bg-[#0a0a0a] py-8 text-center">
                <p className="text-zinc-500 font-medium text-sm">
                  Powered by <span className={`${theme.text} font-bold`}>BarberFlow</span> Enterprise &copy; {new Date().getFullYear()}
                </p>
              </footer>
            </motion.div>
          )}

          {step > 1 && (
            <div className="flex flex-col md:flex-row w-full flex-1 bg-[#0a0a0a]">
              
              {/* Sidebar Desktop (Only visible on md:flex) */}
              <div className="hidden md:flex flex-col w-[320px] shrink-0 border-r border-zinc-900 bg-[#0a0a0a] p-8 h-screen sticky top-0 overflow-y-auto">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-12">
                  {tenant?.logo_url ? (
                    <img src={tenant.logo_url} alt="Logo" className="h-10 object-contain" />
                  ) : (
                    <div className={`w-10 h-10 border ${theme.border} ${theme.text} rounded-full flex items-center justify-center font-bold text-lg`}>
                      {tenant?.name?.charAt(0) || 'RC'}
                    </div>
                  )}
                  <h1 className="text-sm font-bold tracking-widest text-white uppercase truncate">
                    {tenant?.name || 'RC BARBER SHOP'}
                  </h1>
                </div>

                {/* Vertical Stepper */}
                <div className="flex flex-col gap-8 flex-1">
                  {[
                    { num: 1, title: 'Elige un barbero', sub: 'Selecciona a tu profesional' },
                    { num: 2, title: 'Selecciona un día', sub: 'Elige la fecha' },
                    { num: 3, title: 'Elige la hora', sub: 'Horarios disponibles' },
                    { num: 4, title: 'Tus datos', sub: 'Completa tu información' },
                  ].map((s) => {
                    const isActive = step - 1 === s.num;
                    const isCompleted = step - 1 > s.num;
                    return (
                      <div key={s.num} className={`flex items-start gap-4 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 text-sm font-bold transition-colors ${
                          isActive || isCompleted 
                            ? `border-transparent ${theme.bg} text-[#0a0a0a]` 
                            : 'border-zinc-700 text-zinc-500 bg-transparent'
                        }`}>
                          {s.num}
                        </div>
                        <div className="flex flex-col mt-1">
                          <span className={`text-sm font-bold ${isActive || isCompleted ? 'text-white' : 'text-zinc-400'}`}>
                            {s.title}
                          </span>
                          <span className="text-xs text-zinc-500 mt-0.5">{s.sub}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* WhatsApp CTA */}
                <div className="mt-8 pt-8 border-t border-zinc-900">
                  <p className="text-zinc-500 text-xs mb-2">¿Necesitas ayuda?</p>
                  <a href="#" className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors">
                    Escríbenos por WhatsApp
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                  </a>
                </div>
              </div>

              {/* Main Content Container */}
              <div className="flex-1 flex flex-col relative pb-32 md:pb-0">
                <motion.div
                  key={`step${step}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full max-w-3xl mx-auto px-6 py-8 md:py-16 flex-1 flex flex-col"
                >
                  {/* Step Titles */}
                  {step === 2 && (
                    <div className="mb-10 text-center md:text-left">
                      <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                        Selecciona a tu <br className="hidden md:block"/>
                        <span className={theme.text}>barbero favorito</span>
                      </h2>
                      <p className="text-zinc-400 text-sm md:text-base">Profesionales verificados y listos para brindarte la mejor experiencia.</p>
                    </div>
                  )}
                  {step === 3 && (
                    <div className="mb-10 text-center md:text-left">
                      <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                        Elige el día <br className="hidden md:block"/>
                        <span className={theme.text}>de tu cita</span>
                      </h2>
                      <p className="text-zinc-400 text-sm md:text-base">Selecciona una fecha disponible para tu reserva.</p>
                    </div>
                  )}
                  {step === 4 && (
                    <div className="mb-10 text-center md:text-left">
                      <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                        Selecciona tu <br className="hidden md:block"/>
                        <span className={theme.text}>horario ideal</span>
                      </h2>
                      <p className="text-zinc-400 text-sm md:text-base">Horarios disponibles para el {selectedDate || 'día seleccionado'}.</p>
                    </div>
                  )}
                  {step === 5 && (
                    <div className="mb-10 text-center md:text-left">
                      <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                        Completa tus <span className={theme.text}>datos</span> <br className="hidden md:block"/>
                        para la reserva
                      </h2>
                      <p className="text-zinc-400 text-sm md:text-base">Confirma tu información para agendar tu cita.</p>
                    </div>
                  )}
              {step === 2 && (
                <BarberSelection
                  barbers={barbers}
                  selectedBarberId={selectedBarber?.id}
                  onSelect={(id) => {
                    const b = barbers.find((x: Barber) => x.id === id);
                    if (b) {
                      setSelectedBarber(b);
                      // Resetear estado de fecha/hora por si el barbero cambió
                      setSelectedDate('');
                      setSelectedTime('');
                      handleNext();
                    }
                  }}
                  isLoading={isLoadingBarbers}
                  theme={theme}
                />
              )}

              {step === 3 && (
                <DateSelection
                  selectedDate={selectedDate}
                  onSelect={(d) => { 
                    setSelectedDate(d); 
                    setSelectedTime('');
                    handleNext(); 
                  }}
                  theme={theme}
                />
              )}

              {step === 4 && (
                <TimeSelection
                  timeSlots={availableSlots}
                  selectedTime={selectedTime}
                  onSelect={(t) => { setSelectedTime(t); handleNext(); }}
                  isLoading={false}
                  theme={theme}
                />
              )}

              {step === 5 && selectedService && (
                <BookingForm
                  onSubmit={handleBookingSubmit}
                  isSubmitting={false}
                  theme={theme}
                />
              )}

              {step === 6 && createdAppointment && selectedService && (
                <BookingSuccess 
                  appointment={createdAppointment}
                  service={selectedService}
                  onReset={handleReset}
                  theme={theme}
                  tenant={tenant}
                />
              )}

                </motion.div>

                {/* Bottom Navigation Bar */}
                {step > 1 && step < 5 && (
                  <div className="fixed md:absolute bottom-0 left-0 md:left-auto right-0 w-full bg-[#0a0a0a]/90 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-t border-zinc-900 md:border-none p-4 md:p-8 flex items-center justify-between gap-4 z-50">
                    <button 
                      onClick={handleBack} 
                      className="hidden md:flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                      Volver
                    </button>
                    
                    <button 
                      onClick={handleNext}
                      className={`flex-1 md:flex-none flex items-center justify-center md:justify-between gap-2 text-[#0a0a0a] ${theme.bg} px-8 py-4 rounded-xl font-bold ${theme.bgHover} transition-colors md:ml-auto w-full md:w-auto shadow-lg shadow-black/20`}
                    >
                      Continuar
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
