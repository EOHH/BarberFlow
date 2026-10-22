import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { usePublicBooking } from '../../shared/hooks/usePublicBooking';
import { usePublicGallery } from '../../shared/hooks/usePublicGallery';
import { FindBooking } from './FindBooking';
import { PublicGalleryTab } from './PublicGalleryTab';

import { ServiceSelection } from './components/ServiceSelection';
import { BarberSelection } from './components/BarberSelection';
import { DateSelection } from './components/DateSelection';
import { TimeSelection } from './components/TimeSelection';
import { BookingForm } from './components/BookingForm';
import { BookingSuccess } from './components/BookingSuccess';
import { LocationContact } from './components/LocationContact';
import { bookingRepository } from '../../infrastructure/supabase/repositories/booking.repository';
import type { Service, Appointment, Barber } from '../../types';
import { 
  ChevronLeft, MapPin, 
  Scissors, Calendar, ArrowLeft, Check,
  Menu, X, Image as ImageIcon, Sparkles, Award, CalendarCheck,
  MessageCircle
} from 'lucide-react';
import { usePublicTenant } from '../../shared/hooks/usePublicTenant';
import { useDynamicPWA } from '../../shared/hooks/useDynamicPWA';
import { usePublicRealtime } from '../../shared/hooks/usePublicRealtime';
import { notifications as toast } from '../../shared/lib/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { getThemeClasses } from '../../shared/utils/theme';

export function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [searchParams, setSearchParams] = useSearchParams();
  const step = Number(searchParams.get('step')) || 1;

  const setStep = (newStep: number | ((prev: number) => number)) => {
    const nextStep = typeof newStep === 'function' ? newStep(step) : newStep;
    if (nextStep === 1) {
      setSearchParams(new URLSearchParams());
    } else {
      setSearchParams({ step: nextStep.toString() });
    }
  };

  const rawTab = searchParams.get('tab');
  const currentTab: 'servicios' | 'galeria' | 'citas' = 
    rawTab === 'galeria' || rawTab === 'citas' ? rawTab : 'servicios';

  const mainRef = useRef<HTMLElement>(null);

  const setCurrentTab = (tab: 'servicios' | 'galeria' | 'citas') => {
    const currentParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      currentParams[key] = value;
    });
    setSearchParams({ ...currentParams, tab });
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  };

  // Restablecer posición de scroll al inicio al cambiar de pestaña o acceder vía URL
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [currentTab]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const bookingSubmissionLock = useRef(false);

  const { tenantData } = usePublicTenant(slug);
  const tenant = tenantData?.tenant || { name: slug || '', theme_color: undefined, logo_url: undefined };
  const theme = getThemeClasses(tenant?.theme_color);

  useDynamicPWA(tenant);
  usePublicRealtime(tenant?.id, slug);

  // TanStack Query
  const { services, barbers, availableSlots, isLoadingServices, isLoadingBarbers } = usePublicBooking(
    slug,
    selectedDate, 
    selectedService?.id,
    selectedBarber?.id
  );

  const { galleryImages } = usePublicGallery(slug);

  // Redirigir al catálogo si se pierde el servicio seleccionado en pasos posteriores
  useEffect(() => {
    if (step > 1 && !selectedService) {
      setStep(1);
    }
  }, [step, selectedService]);

  const handleNext = () => {
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setStep(s => Math.max(1, s - 1));
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
    if (bookingSubmissionLock.current) return;
    if (!selectedService || !selectedDate || !selectedTime || !selectedBarber) return;

    bookingSubmissionLock.current = true;
    setIsSubmittingBooking(true);
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
      setStep(6);
    } catch {
      toast.error('No pudimos crear la reserva', {
        description: 'El horario pudo cambiar. Selecciona otro o inténtalo nuevamente.',
      });
    } finally {
      bookingSubmissionLock.current = false;
      setIsSubmittingBooking(false);
    }
  };

  const scrollToCatalog = () => {
    if (currentTab !== 'servicios') {
      setCurrentTab('servicios');
    }
    const elem = document.getElementById('catalogo');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToLocation = () => {
    if (currentTab !== 'servicios') {
      setCurrentTab('servicios');
    }
    setTimeout(() => {
      const elem = document.getElementById('ubicacion');
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  if (isLoadingServices && step === 1) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
        <div className={`animate-spin w-9 h-9 border-3 ${theme.border} border-t-transparent rounded-full mb-4`}></div>
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400">Cargando catálogo...</p>
      </div>
    );
  }

  const getStepTitle = () => {
    switch(step) {
      case 1: return "Elige un Servicio";
      case 2: return "Elige tu Barbero";
      case 3: return "Elige el Día";
      case 4: return "Elige la Hora";
      case 5: return "Tus Datos";
      case 6: return "Confirmación";
      default: return "Reservar";
    }
  };

  const whatsappUrl = tenant.whatsapp_number 
    ? `https://wa.me/${tenant.whatsapp_number.replace(/[^0-9]/g, '')}` 
    : undefined;

  const initials = tenant?.name 
    ? tenant.name.split(' ').filter(Boolean).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() 
    : (slug ? slug.slice(0, 2).toUpperCase() : 'B');

  const displayName = tenant?.name || slug?.toUpperCase() || 'BARBERSHOP';

  return (
    <div className={`w-full min-h-screen flex flex-col font-sans ${theme.selectionBg} bg-[#0a0a0a] text-white relative`}>
      
      {/* =========================================================================
          TOP NAVIGATION HEADER (DESKTOP & MOBILE)
         ========================================================================= */}
      <header className={`sticky top-0 z-50 h-16 md:h-20 flex items-center justify-between px-4 sm:px-6 lg:px-12 transition-all bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-zinc-850/80 ${
        step > 1 ? 'md:hidden' : ''
      }`}>
        
        {/* Left: Logo & Brand Info */}
        <div className="flex items-center gap-3">
          {step > 1 && step < 6 && (
            <button 
              onClick={handleBack} 
              className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-850 active:bg-zinc-800 transition-colors cursor-pointer"
              title="Volver"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          
          <div 
            className="flex items-center gap-3 cursor-pointer select-none" 
            onClick={() => { 
              if (step > 1) handleReset(); 
              else {
                setCurrentTab('servicios');
              }
            }}
          >
            {/* Logo / Monogram using dynamic theme border */}
            {tenant?.logo_url ? (
              <img 
                src={tenant.logo_url} 
                alt={displayName} 
                className={`h-10 w-10 sm:h-11 sm:w-11 object-contain rounded-full border ${theme.border} p-0.5 bg-zinc-950 shadow-md`} 
              />
            ) : (
              <div className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full border ${theme.border} p-0.5 flex items-center justify-center bg-zinc-950 shadow-md shrink-0`}>
                <div className="w-full h-full rounded-full border border-white/10 flex items-center justify-center bg-[#111]">
                  <span className={`font-serif font-black text-xs sm:text-sm tracking-wider ${theme.text}`}>
                    {initials}
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-extrabold tracking-widest text-white uppercase truncate max-w-[170px] sm:max-w-xs">
                {displayName}
              </span>
              <span className="text-[9px] font-semibold text-zinc-400 tracking-[0.22em] uppercase">
                {tenant?.name ? 'BARBERÍA & ESTILO' : 'RESERVA ONLINE'}
              </span>
            </div>
          </div>
          
          {step > 1 && step < 6 && (
            <div className="flex flex-col items-center pointer-events-none md:hidden ml-2">
              <span className={`text-[11px] font-bold ${theme.text} tracking-wider uppercase`}>
                {getStepTitle()}
              </span>
            </div>
          )}
        </div>

        {/* Center: Desktop Menu Tabs (Servicios, Galería, Mis Citas, Ubicación) */}
        {step === 1 && (
          <nav className="hidden md:flex items-center gap-1 p-1 bg-zinc-900/90 border border-zinc-800/80 rounded-full shadow-inner">
            <button 
              onClick={() => setCurrentTab('servicios')}
              className={`px-5 py-2 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
                currentTab === 'servicios'
                  ? `${theme.bg} text-white shadow-md shadow-black/40`
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              Servicios
            </button>
            <button 
              onClick={() => setCurrentTab('galeria')}
              className={`px-5 py-2 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
                currentTab === 'galeria'
                  ? `${theme.bg} text-white shadow-md shadow-black/40`
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              Galería
            </button>
            <button 
              onClick={() => setCurrentTab('citas')}
              className={`px-5 py-2 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer ${
                currentTab === 'citas'
                  ? `${theme.bg} text-white shadow-md shadow-black/40`
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              Mis Citas
            </button>
            <button 
              onClick={scrollToLocation}
              className="px-5 py-2 text-xs font-bold rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all duration-200 cursor-pointer"
            >
              Ubicación
            </button>
          </nav>
        )}

        {/* Right: WhatsApp Pill (Desktop) & Hamburger Button (Mobile) */}
        <div className="flex items-center gap-2">
          {step === 1 && (
            <>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-200 bg-zinc-900/90 hover:bg-zinc-800 hover:text-white border border-zinc-800 rounded-full transition-all shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp</span>
                </a>
              )}

              {/* Hamburger Button (Mobile) */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="md:hidden w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Abrir menú"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </>
          )}
        </div>
      </header>

      {/* =========================================================================
          MOBILE LATERAL DRAWER MENU
         ========================================================================= */}
      <AnimatePresence>
        {isMobileMenuOpen && step === 1 && (
          <div className="fixed inset-0 z-50 md:hidden flex justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md" 
              onClick={() => setIsMobileMenuOpen(false)} 
            />

            {/* Drawer Sheet */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              className="relative w-80 max-w-[85vw] h-full bg-[#111111] shadow-2xl flex flex-col border-l border-zinc-800 z-10"
            >
              {/* Drawer Header */}
              <div className="h-20 flex items-center justify-between px-6 border-b border-zinc-800/80">
                <span className="font-extrabold text-white tracking-widest uppercase text-sm">MENÚ</span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Drawer Navigation Links */}
              <div className="flex flex-col p-6 gap-3 overflow-y-auto flex-1">
                <button 
                  onClick={() => {
                    setCurrentTab('servicios');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-sm font-bold text-left px-4 py-3.5 rounded-2xl transition-all flex items-center gap-3 cursor-pointer ${
                    currentTab === 'servicios' 
                      ? `${theme.bg} text-white shadow-lg shadow-black/40` 
                      : 'bg-zinc-900/60 text-zinc-300 hover:text-white hover:bg-zinc-850'
                  }`}
                >
                  <Scissors className="w-4 h-4 shrink-0" />
                  <span>Catálogo de Servicios</span>
                </button>

                <button 
                  onClick={() => {
                    setCurrentTab('galeria');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-sm font-bold text-left px-4 py-3.5 rounded-2xl transition-all flex items-center gap-3 cursor-pointer ${
                    currentTab === 'galeria' 
                      ? `${theme.bg} text-white shadow-lg shadow-black/40` 
                      : 'bg-zinc-900/60 text-zinc-300 hover:text-white hover:bg-zinc-855'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 shrink-0" />
                  <span>Galería de Trabajos</span>
                </button>

                <button 
                  onClick={() => {
                    setCurrentTab('citas');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-sm font-bold text-left px-4 py-3.5 rounded-2xl transition-all flex items-center gap-3 cursor-pointer ${
                    currentTab === 'citas' 
                      ? `${theme.bg} text-white shadow-lg shadow-black/40` 
                      : 'bg-zinc-900/60 text-zinc-300 hover:text-white hover:bg-zinc-850'
                  }`}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Mis Citas</span>
                </button>

                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    scrollToLocation();
                  }}
                  className="text-sm font-bold text-left px-4 py-3.5 rounded-2xl transition-all flex items-center gap-3 bg-zinc-900/60 text-zinc-300 hover:text-white hover:bg-zinc-850 cursor-pointer"
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>Ubicación</span>
                </button>
                
                {/* Bottom Section: Real WhatsApp link if configured */}
                {whatsappUrl && (
                  <div className="mt-auto pt-6 border-t border-zinc-800/80 flex flex-col">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-[#10b981] hover:bg-[#059669] px-5 py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Escribir por WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MAIN CONTENT VIEWPORT
         ========================================================================= */}
      <main ref={mainRef} className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Main Catalog & Portal Experience */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col flex-1 pb-20 md:pb-0"
            >
              {currentTab === 'servicios' && (
                <>
                  {/* =================================================================
                      HERO SECTION (DESKTOP ONLY - INTEGRATED BANNER - HIDDEN ON MOBILE)
                     ================================================================= */}
                  <div className="hidden md:block w-full max-w-7xl mx-auto px-6 lg:px-12 pt-6 pb-2">
                    {/* Integrated Horizontal Banner matching reference */}
                    <div className="relative w-full rounded-3xl overflow-hidden border border-zinc-800/80 bg-zinc-950 shadow-2xl min-h-[380px] lg:min-h-[420px] flex items-center">
                      {/* Atmospheric background photograph */}
                      <div 
                        className="absolute inset-0 bg-cover bg-no-repeat transition-transform duration-1000 ease-out hover:scale-105"
                        style={{ 
                          backgroundImage: "url('/images/barbershop-hero.jpg')",
                          backgroundPosition: 'right 20% center'
                        }}
                      />
                      
                      {/* Deep dark gradient from left to ensure 100% legibility */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 via-50% to-transparent pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                      {/* Overlaid Hero Content (Left-aligned) */}
                      <div className="relative z-10 max-w-xl lg:max-w-2xl p-8 sm:p-10 lg:p-14 flex flex-col items-start">
                        <span className={`text-xs font-bold tracking-[0.25em] ${theme.text} uppercase mb-3.5 flex items-center gap-2`}>
                          ESTILO • PRECISIÓN • CONFIANZA
                        </span>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[52px] font-serif font-medium text-white tracking-tight leading-[1.12] mb-4">
                          Más que un corte, <br />
                          <span className={`font-serif italic font-normal ${theme.text}`}>una experiencia</span>
                        </h1>

                        <p className="text-zinc-300 text-xs sm:text-sm lg:text-[15px] max-w-lg mb-8 leading-relaxed font-normal">
                          Barbería profesional con estilo moderno, ambiente cómodo y atención personalizada.
                        </p>

                        {/* Action buttons inside the banner */}
                        <div className="flex items-center gap-3.5">
                          <button
                            onClick={scrollToCatalog}
                            className={`inline-flex items-center gap-2.5 ${theme.bg} ${theme.bgHover} text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-black/40 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer`}
                          >
                            <Scissors className="w-4 h-4 text-white" />
                            <span>Ver Servicios</span>
                          </button>

                          <button
                            onClick={scrollToCatalog}
                            className="inline-flex items-center gap-2.5 bg-black/50 hover:bg-zinc-900/90 border border-zinc-700/80 text-white font-semibold text-xs sm:text-sm px-6 py-3.5 rounded-xl transition-all hover:border-zinc-500 cursor-pointer backdrop-blur-sm"
                          >
                            <Calendar className="w-4 h-4 text-zinc-300" />
                            <span>Reservar Cita</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* =================================================================
                        BENEFITS BAR (DESKTOP ONLY - MATCHING APPROVED DESIGN)
                       ================================================================= */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 mt-4 rounded-2xl bg-[#0e0e0e] border border-zinc-850/90 shadow-lg">
                      {/* Item 1 */}
                      <div className="flex items-center gap-3.5 px-3 py-2">
                        <div className={`w-10 h-10 rounded-full border ${theme.border} ${theme.bgLight} flex items-center justify-center shrink-0 ${theme.text}`}>
                          <Scissors className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white tracking-wide">Barberos Profesionales</span>
                          <span className="text-[11px] text-zinc-400">Expertos en estilo masculino</span>
                        </div>
                      </div>

                      {/* Item 2 */}
                      <div className="flex items-center gap-3.5 px-3 py-2">
                        <div className={`w-10 h-10 rounded-full border ${theme.border} ${theme.bgLight} flex items-center justify-center shrink-0 ${theme.text}`}>
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white tracking-wide">Ambiente Premium</span>
                          <span className="text-[11px] text-zinc-400">Espacio cómodo y moderno</span>
                        </div>
                      </div>

                      {/* Item 3 */}
                      <div className="flex items-center gap-3.5 px-3 py-2">
                        <div className={`w-10 h-10 rounded-full border ${theme.border} ${theme.bgLight} flex items-center justify-center shrink-0 ${theme.text}`}>
                          <Award className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white tracking-wide">Productos de Calidad</span>
                          <span className="text-[11px] text-zinc-400">Las mejores marcas</span>
                        </div>
                      </div>

                      {/* Item 4 */}
                      <div className="flex items-center gap-3.5 px-3 py-2">
                        <div className={`w-10 h-10 rounded-full border ${theme.border} ${theme.bgLight} flex items-center justify-center shrink-0 ${theme.text}`}>
                          <CalendarCheck className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white tracking-wide">Reserva Fácil</span>
                          <span className="text-[11px] text-zinc-400">En pocos pasos</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Immediate Service Catalog Section */}
                  <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-6 md:py-10 flex-1">
                    <ServiceSelection 
                      services={services}
                      selectedServiceId={selectedService?.id}
                      onSelect={(id) => { 
                        const s = services.find((x: Service) => x.id === id);
                        if (s) {
                          setSelectedService(s); 
                          setSelectedBarber(null);
                          setSelectedDate('');
                          setSelectedTime('');
                          handleNext(); 
                        }
                      }}
                      isLoading={isLoadingServices}
                      theme={theme}
                    />
                  </div>

                  {/* Location & Hours Section */}
                  <LocationContact 
                    theme={theme} 
                    tenant={tenant as any} 
                    onBookClick={scrollToCatalog}
                  />
                </>
              )}

              {currentTab === 'galeria' && (
                <PublicGalleryTab 
                  theme={theme} 
                  images={galleryImages} 
                  slug={slug}
                  onBookClick={() => {
                    setCurrentTab('servicios');
                    scrollToCatalog();
                  }}
                />
              )}

              {currentTab === 'citas' && (
                <div id="citas-section" className="w-full bg-[#0a0a0a] min-h-[60vh] flex flex-col scroll-mt-24">
                  <FindBooking />
                </div>
              )}

              {/* Minimalist Footer */}
              <footer className="w-full border-t border-zinc-900 bg-[#0a0a0a] py-6 text-center">
                <p className="text-zinc-600 font-medium text-xs tracking-wide">
                  Plataforma de Reservas &copy; {new Date().getFullYear()} • <span className={`${theme.text} font-bold`}>BarberFlow</span>
                </p>
              </footer>
            </motion.div>
          )}

          {/* STEP > 1: Streamlined Multi-Step Flow */}
          {step > 1 && (
            <div className="flex flex-col md:flex-row w-full flex-1 bg-[#0a0a0a]">
              
              {/* Desktop Stepper Sidebar */}
              <aside className="hidden md:flex flex-col w-[300px] shrink-0 border-r border-zinc-900 bg-[#0c0c0c] p-6 lg:p-8 h-screen sticky top-0 overflow-y-auto">
                
                {/* Logo & Shop info */}
                <div 
                  className="flex items-center gap-3 mb-10 cursor-pointer group"
                  onClick={handleReset}
                  title="Volver al catálogo"
                >
                  {tenant?.logo_url ? (
                    <img src={tenant.logo_url} alt={displayName} className="h-9 w-9 object-contain rounded-full border border-zinc-800" />
                  ) : (
                    <div className={`w-9 h-9 border ${theme.border} ${theme.text} rounded-full flex items-center justify-center font-bold text-sm bg-zinc-900`}>
                      {initials}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <h1 className="text-xs font-black tracking-wider text-white uppercase truncate max-w-[170px]">
                      {displayName}
                    </h1>
                    <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors flex items-center gap-1">
                      <ArrowLeft className="w-2.5 h-2.5" /> Volver al catálogo
                    </span>
                  </div>
                </div>

                {/* Vertical Stepper List */}
                <div className="flex flex-col gap-6 flex-1">
                  {[
                    { num: 1, title: 'Barbero', sub: selectedBarber?.name || 'Selecciona a tu profesional' },
                    { num: 2, title: 'Fecha', sub: selectedDate || 'Elige el día' },
                    { num: 3, title: 'Horario', sub: selectedTime || 'Horarios disponibles' },
                    { num: 4, title: 'Tus Datos', sub: 'Completa la confirmación' },
                  ].map((s) => {
                    const isActive = step - 1 === s.num;
                    const isCompleted = step - 1 > s.num;
                    return (
                      <div 
                        key={s.num} 
                        className={`flex items-start gap-3.5 transition-opacity duration-300 ${
                          isActive ? 'opacity-100' : isCompleted ? 'opacity-70' : 'opacity-30'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                          isCompleted
                            ? 'bg-emerald-500 text-black border-transparent shadow-sm'
                            : isActive 
                              ? `${theme.bg} text-white font-extrabold border-transparent shadow-md`
                              : 'border-zinc-700 text-zinc-500 bg-transparent'
                        }`}>
                          {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                        </div>
                        <div className="flex flex-col mt-0.5">
                          <span className={`text-xs font-bold tracking-wide ${isActive || isCompleted ? 'text-white' : 'text-zinc-400'}`}>
                            {s.title}
                          </span>
                          <span className="text-[11px] text-zinc-500 mt-0.5 truncate max-w-[170px]">{s.sub}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Service in sidebar */}
                {selectedService && (
                  <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl mb-6">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-1">
                      Servicio Seleccionado
                    </span>
                    <p className="text-xs font-bold text-white truncate">{selectedService.name}</p>
                    <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-zinc-800">
                      <span className="text-zinc-400">{selectedService.duration_minutes} min</span>
                      <span className={`font-black ${theme.text}`}>S/ {Number(selectedService.price).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* WhatsApp Help */}
                {whatsappUrl && (
                  <div className="pt-4 border-t border-zinc-900">
                    <a 
                      href={whatsappUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>¿Dudas? Escríbenos</span>
                    </a>
                  </div>
                )}
              </aside>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col relative pb-28 md:pb-12 min-h-screen">
                
                {/* Active Selection Sticky Pill */}
                {selectedService && step < 6 && (
                  <div className="w-full bg-zinc-900/70 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-6 py-3">
                    <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className={`p-1.5 rounded-lg ${theme.bgLight} ${theme.text}`}>
                          <Scissors className="w-3.5 h-3.5" />
                        </span>
                        <span className="font-bold text-white truncate">{selectedService.name}</span>
                        <span className="text-zinc-500 hidden sm:inline">•</span>
                        <span className="text-zinc-400 hidden sm:inline">{selectedService.duration_minutes} min</span>
                        <span className="text-zinc-500 hidden sm:inline">•</span>
                        <span className={`font-black ${theme.text} hidden sm:inline`}>S/ {Number(selectedService.price).toFixed(2)}</span>
                      </div>

                      <button
                        onClick={handleReset}
                        className="shrink-0 text-[11px] font-bold text-zinc-400 hover:text-white underline transition-colors cursor-pointer"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>
                )}

                {/* Step Content */}
                <motion.div
                  key={`step${step}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 md:py-10 flex-1 flex flex-col"
                >
                  {/* Step Titles */}
                  {step === 2 && (
                    <div className="mb-6 md:mb-8 text-center md:text-left">
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
                        Selecciona a tu <span className={theme.text}>barbero</span>
                      </h2>
                      <p className="text-zinc-400 text-xs sm:text-sm">Profesionales listos para darte la mejor experiencia.</p>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="mb-6 md:mb-8 text-center md:text-left">
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
                        Elige el día <span className={theme.text}>de tu cita</span>
                      </h2>
                      <p className="text-zinc-400 text-xs sm:text-sm">Selecciona una fecha disponible para tu reserva.</p>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="mb-6 md:mb-8 text-center md:text-left">
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
                        Selecciona tu <span className={theme.text}>horario</span>
                      </h2>
                      <p className="text-zinc-400 text-xs sm:text-sm">Horarios disponibles para el {selectedDate || 'día seleccionado'}.</p>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="mb-6 md:mb-8 text-center md:text-left">
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
                        Completa tus <span className={theme.text}>datos</span>
                      </h2>
                      <p className="text-zinc-400 text-xs sm:text-sm">Confirma tu teléfono para recibir los detalles de tu cita.</p>
                    </div>
                  )}

                  {/* Step Components */}
                  {step === 2 && (
                    <BarberSelection
                      barbers={barbers}
                      selectedBarberId={selectedBarber?.id}
                      onSelect={(id) => {
                        const b = barbers.find((x: Barber) => x.id === id);
                        if (b) {
                          setSelectedBarber(b);
                          setSelectedDate('');
                          setSelectedTime('');
                        }
                      }}
                      onContinue={handleNext}
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
                      }}
                      onContinue={handleNext}
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
                      isSubmitting={isSubmittingBooking}
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

                {/* Back Button Navigation */}
                {step > 1 && step < 6 && (
                  <div className="fixed md:static bottom-0 left-0 right-0 p-4 md:px-6 md:py-4 bg-[#0a0a0a]/90 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-t md:border-t-0 border-zinc-800 z-20">
                    <div className="max-w-3xl mx-auto flex items-center justify-between">
                      <button 
                        onClick={handleBack} 
                        className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white px-4 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Paso Anterior</span>
                      </button>

                      <button
                        onClick={handleReset}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        Cancelar reserva
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* =========================================================================
          MOBILE BOTTOM NAVIGATION (EXACT MATCH TO APPROVED LAYOUT)
         ========================================================================= */}
      {step === 1 && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0d0d0d]/95 backdrop-blur-xl border-t border-zinc-850 px-6 py-2.5 flex justify-between items-center shadow-2xl">
          {/* Servicios */}
          <button
            onClick={() => setCurrentTab('servicios')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer ${
              currentTab === 'servicios' ? theme.text : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Scissors className="w-5 h-5" />
            <span>Servicios</span>
          </button>

          {/* Galería */}
          <button
            onClick={() => setCurrentTab('galeria')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer ${
              currentTab === 'galeria' ? theme.text : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            <span>Galería</span>
          </button>

          {/* Mis Citas */}
          <button
            onClick={() => setCurrentTab('citas')}
            className={`flex flex-col items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer ${
              currentTab === 'citas' ? theme.text : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>Mis Citas</span>
          </button>

          {/* Ubicación */}
          <button
            onClick={scrollToLocation}
            className="flex flex-col items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          >
            <MapPin className="w-5 h-5" />
            <span>Ubicación</span>
          </button>
        </nav>
      )}

    </div>
  );
}
