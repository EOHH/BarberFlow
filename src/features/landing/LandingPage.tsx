import { Link } from 'react-router-dom';
import { 
  Scissors, CalendarCheck, Users, ShieldCheck, 
  Clock, CheckCircle2, ChevronRight, Menu, X, Star, Lock, Server, Cloud, Shield
} from 'lucide-react';
import { useState, useEffect } from 'react';

// === CONSTANTS & MOCK DATA ===
const METRICS = [
  { label: 'Barberías activas', value: '+2.5K' },
  { label: 'Citas gestionadas al mes', value: '+150K' },
  { label: 'Clientes satisfechos', value: '98%' },
  { label: 'Soporte especializado', value: '24/7' },
];

const FEATURES = [
  {
    icon: <CalendarCheck className="w-5 h-5 text-[#D9AC38]" />,
    title: 'Reservas online',
    desc: 'Tus clientes reservan cuando quieran, desde cualquier lugar.'
  },
  {
    icon: <Users className="w-5 h-5 text-[#D9AC38]" />,
    title: 'Gestión de personal',
    desc: 'Organiza horarios, comisiones y rendimiento de tu equipo.'
  },
  {
    icon: <Star className="w-5 h-5 text-[#D9AC38]" />,
    title: 'Fidelización de clientes',
    desc: 'Programa lealtad, promociones y seguimiento inteligente.'
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-[#D9AC38]" />,
    title: 'Reportes avanzados',
    desc: 'Toma decisiones con datos realistas y actualizados.'
  },
  {
    icon: <Clock className="w-5 h-5 text-[#D9AC38]" />,
    title: 'Recordatorios automáticos',
    desc: 'Reduce ausencias con notificaciones por WhatsApp.'
  },
  {
    icon: <CheckCircle2 className="w-5 h-5 text-[#D9AC38]" />,
    title: 'Control de inventario',
    desc: 'Gestiona productos, stock y alertas de reposición.'
  }
];

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Smooth scroll logic
  useEffect(() => {
    const handleHashClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const id = target.getAttribute('href')?.slice(1);
        const element = document.getElementById(id || '');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
          setIsMenuOpen(false);
        }
      }
    };
    document.addEventListener('click', handleHashClick);
    return () => document.removeEventListener('click', handleHashClick);
  }, []);

  return (
    <div className="min-h-screen bg-[#080A0C] text-white font-sans selection:bg-[#D9AC38]/30 selection:text-white overflow-x-hidden">
      
      {/* 1. HEADER */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-[#080A0C]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-6 lg:px-12 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Scissors className="w-6 h-6 text-[#D9AC38]" />
            <span className="text-xl font-bold tracking-tight font-serif text-white">BarberFlow</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Características</a>
            <a href="#security" className="hover:text-white transition-colors">Seguridad</a>
            <a href="#pricing" className="hover:text-white transition-colors">Precios</a>
            <a href="#benefits" className="hover:text-white transition-colors">Beneficios</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/login" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
              Iniciar Sesión
            </Link>
            <Link to="/register" className="text-sm font-semibold bg-[#D9AC38] hover:bg-[#c29626] text-[#080A0C] px-5 py-2.5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(217,172,56,0.3)]">
              Crear mi barbería gratis
            </Link>
          </div>

          <button className="md:hidden text-gray-300 hover:text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-[#111315] border-b border-white/5 py-4 px-6 flex flex-col gap-4 shadow-2xl">
            <a href="#features" className="text-gray-300 font-medium">Características</a>
            <a href="#security" className="text-gray-300 font-medium">Seguridad</a>
            <a href="#pricing" className="text-gray-300 font-medium">Precios</a>
            <div className="h-px w-full bg-white/5 my-2" />
            <Link to="/login" className="text-gray-300 font-medium">Iniciar Sesión</Link>
            <Link to="/register" className="text-center font-bold bg-[#D9AC38] text-[#080A0C] py-3 rounded-xl mt-2">Crear mi barbería gratis</Link>
          </div>
        )}
      </nav>

      <main>
        {/* 2. HERO */}
        <section className="relative min-h-screen flex items-center pt-32 md:pt-40 pb-20 overflow-hidden">
          {/* Imagen de fondo premium cinematográfica */}
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center md:bg-[center_right_10%] lg:bg-[center_right_20%] z-0"
            style={{ backgroundImage: "url('/images/hero-barberflow.webp')" }}
          >
            {/* Overlays para integración cinematográfica: 
                - Degradado negro fuerte desde la izquierda para legibilidad del texto
                - Degradado oscuro desde abajo para fundirse con la siguiente sección
                - Overlay sutil extra en móviles para oscurecer la imagen detrás del texto */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#080A0C] via-[#080A0C]/90 to-transparent w-full md:w-[65%] lg:w-[55%] z-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080A0C] via-[#080A0C]/20 to-transparent z-0" />
            <div className="absolute inset-0 bg-black/40 md:bg-transparent z-0" />
          </div>

          <div className="relative z-10 px-6 lg:px-12 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center mt-12 md:mt-0">
            {/* Izquierda - Contenido Textual DOM */}
            <div className="w-full md:w-[55%] lg:w-[50%] text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-8 backdrop-blur-sm">
                <Star className="w-3.5 h-3.5 text-[#D9AC38]" />
                <span className="text-[10px] md:text-xs font-medium text-gray-300 uppercase tracking-widest">El estándar premium para tu negocio</span>
              </div>
              
              <h1 className="text-[2.75rem] md:text-5xl lg:text-6xl xl:text-7xl font-bold font-serif leading-[1.1] mb-6 text-white drop-shadow-2xl">
                La plataforma<br />
                operativa <span className="text-[#D9AC38] italic">definitiva</span><br />
                para barberías.
              </h1>
              
              <p className="text-gray-300 text-base md:text-lg mb-10 max-w-xl mx-auto md:mx-0 leading-relaxed font-sans drop-shadow-lg">
                Gestiona reservas, personal y fideliza clientes con un ecosistema de alto rendimiento. Diseñado para escalar, creado para impresionar. Tu barbería, tus reglas.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start mb-8">
                <Link to="/register" className="w-full sm:w-auto text-base font-semibold bg-[#D9AC38] text-[#080A0C] px-8 py-4 rounded-full transition-all hover:scale-105 shadow-[0_0_20px_rgba(217,172,56,0.3)] flex items-center justify-center gap-2">
                  Comenzar gratis <ChevronRight className="w-5 h-5" />
                </Link>
                <a href="#demo" className="w-full sm:w-auto text-base font-semibold border border-white/20 text-white px-8 py-4 rounded-full transition-all hover:bg-white/5 flex items-center justify-center gap-3 backdrop-blur-sm">
                  <div className="w-6 h-6 rounded-full border border-white flex items-center justify-center bg-transparent group-hover:bg-white transition-colors">
                    <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-white group-hover:border-l-[#080A0C] border-b-[4px] border-b-transparent ml-0.5 transition-colors"></div>
                  </div> 
                  Ver cómo funciona
                </a>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 text-xs md:text-sm text-gray-400 font-medium">
                <span className="flex items-center gap-1.5 drop-shadow-md"><CheckCircle2 className="w-4 h-4 text-[#D9AC38]" /> Sin tarjeta de crédito</span>
                <span className="flex items-center gap-1.5 drop-shadow-md"><CheckCircle2 className="w-4 h-4 text-[#D9AC38]" /> Configuración en minutos</span>
                <span className="flex items-center gap-1.5 drop-shadow-md"><CheckCircle2 className="w-4 h-4 text-[#D9AC38]" /> Prueba 14 días gratis</span>
              </div>
            </div>

            {/* Derecha - Espacio vacío transparente para dejar brillar la imagen de fondo */}
            <div className="hidden md:block w-[45%] lg:w-[50%]" />
          </div>
        </section>

        {/* 3. TRUST STRIP */}
        <section className="py-10 border-y border-white/5 bg-gradient-to-b from-[#080A0C] to-[#111315]">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-center md:text-left">
            <div className="flex flex-col gap-1">
              <div className="text-[10px] font-bold tracking-[0.2em] text-[#D9AC38] uppercase">Confianza en crecimiento</div>
              <h2 className="text-xl md:text-2xl font-serif text-white">Barberías que ya elevan su negocio</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex -space-x-4">
                <img src="https://i.pravatar.cc/100?img=11" alt="Avatar" className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#111315] object-cover" />
                <img src="https://i.pravatar.cc/100?img=12" alt="Avatar" className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#111315] object-cover" />
                <img src="https://i.pravatar.cc/100?img=33" alt="Avatar" className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#111315] object-cover" />
                <img src="https://i.pravatar.cc/100?img=14" alt="Avatar" className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#111315] object-cover" />
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#111315] bg-[#1a1d21] flex items-center justify-center text-[10px] md:text-xs font-bold text-gray-300 z-10">
                  +2.5K
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. CARACTERÍSTICAS */}
        <section id="features" className="py-24 max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <div className="text-[10px] font-bold tracking-[0.2em] text-[#D9AC38] uppercase mb-4">Características Principales</div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif max-w-2xl mx-auto leading-tight text-white">
              Todo lo que necesitas<br />para <span className="text-[#D9AC38] italic">hacer crecer</span> tu barbería
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 lg:gap-y-16 gap-x-8">
            {FEATURES.map((feature, i) => (
              <div key={i} className="flex flex-col items-center text-center lg:items-start lg:text-left relative group px-4">
                <div className="w-12 h-12 rounded-full border border-white/10 bg-[#111315] flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(217,172,56,0.1)] transition-colors group-hover:border-[#D9AC38]/30">
                  {feature.icon}
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-3 font-serif text-white">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                {/* Vertical Divider (Desktop only) */}
                {(i + 1) % 3 !== 0 && (
                  <div className="hidden lg:block absolute top-0 right-[-1rem] w-px h-[120%] bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 5. SEGURIDAD */}
        <section id="security" className="py-24 bg-[#0A0D10] border-y border-white/5 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-16">
            
            {/* Izquierda - 3D CSS Composition */}
            <div className="flex-1 relative w-full h-[300px] md:h-[400px] flex items-center justify-center">
               <div className="absolute inset-0 bg-[#D9AC38]/5 blur-[100px] rounded-full pointer-events-none" />
               <div className="relative z-10 grid grid-cols-2 gap-4 perspective-[1000px] transform rotate-x-[20deg] rotate-y-[-15deg] scale-75 md:scale-100">
                  {/* Server Nodes Mockups */}
                  <div className="w-32 h-32 bg-gradient-to-br from-[#1a1d21] to-[#111315] border-t border-l border-white/10 rounded-2xl shadow-[20px_20px_40px_rgba(0,0,0,0.8)] flex items-center justify-center relative">
                     <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl pointer-events-none" />
                     <Cloud className="w-10 h-10 text-[#D9AC38]/40" />
                  </div>
                  <div className="w-32 h-32 bg-gradient-to-br from-[#1a1d21] to-[#111315] border-t border-l border-white/10 rounded-2xl shadow-[20px_20px_40px_rgba(0,0,0,0.8)] flex items-center justify-center translate-z-10 relative">
                     <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-2xl pointer-events-none" />
                     <Server className="w-10 h-10 text-[#D9AC38]/40" />
                  </div>
                  <div className="col-span-2 h-40 bg-gradient-to-br from-[#1a1d21] to-[#0A0D10] border-t border-l border-white/20 rounded-2xl shadow-[20px_20px_40px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D9AC38]/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                     <Shield className="w-16 h-16 text-[#D9AC38]" fill="#D9AC38" fillOpacity="0.1" />
                     <Lock className="w-6 h-6 text-[#D9AC38] absolute" />
                  </div>
               </div>
            </div>

            {/* Derecha - Contenido */}
            <div className="flex-1 text-center lg:text-left z-10">
              <div className="text-[10px] font-bold tracking-[0.2em] text-[#D9AC38] uppercase mb-4">Seguridad Empresarial</div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif leading-tight mb-6 text-white">
                Arquitectura sólida, datos seguros, negocio protegido.
              </h2>
              <p className="text-gray-400 text-base md:text-lg mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
                BarberFlow está construido con los más altos estándares de seguridad, utilizando tecnología de punta para proteger tu información y la de tus clientes.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-left">
                <div className="flex gap-4">
                  <div className="mt-1"><Cloud className="w-6 h-6 text-[#D9AC38]" /></div>
                  <div>
                    <h4 className="font-bold text-white mb-1 text-sm md:text-base">Infraestructura en la nube</h4>
                    <p className="text-xs text-gray-500">99.9% de disponibilidad</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1"><ShieldCheck className="w-6 h-6 text-[#D9AC38]" /></div>
                  <div>
                    <h4 className="font-bold text-white mb-1 text-sm md:text-base">Backups automáticos</h4>
                    <p className="text-xs text-gray-500">Nunca pierdes información</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1"><Lock className="w-6 h-6 text-[#D9AC38]" /></div>
                  <div>
                    <h4 className="font-bold text-white mb-1 text-sm md:text-base">Cifrado E2E</h4>
                    <p className="text-xs text-gray-500">Datos siempre protegidos</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1"><CheckCircle2 className="w-6 h-6 text-[#D9AC38]" /></div>
                  <div>
                    <h4 className="font-bold text-white mb-1 text-sm md:text-base">Cumplimiento internacional</h4>
                    <p className="text-xs text-gray-500">Estándares GDPR y SOC 2</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. MÉTRICAS */}
        <section className="bg-[#111315] py-16 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8">
            {METRICS.map((m, i) => (
              <div key={i} className="flex flex-col items-center text-center relative">
                <div className="text-4xl md:text-5xl font-bold text-[#D9AC38] font-serif mb-3 tracking-tight">{m.value}</div>
                <div className="text-[10px] md:text-xs font-semibold text-gray-400 tracking-[0.1em] uppercase">{m.label}</div>
                {/* Vertical Divider */}
                {i % 2 !== 1 && (
                   <div className="hidden lg:block absolute top-1/2 -right-4 w-px h-16 -translate-y-1/2 bg-white/10" />
                )}
                {i === 1 && (
                   <div className="hidden lg:block absolute top-1/2 -right-4 w-px h-16 -translate-y-1/2 bg-white/10" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 7. PRICING */}
        <section id="pricing" className="py-24 max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <div className="text-[10px] font-bold tracking-[0.2em] text-[#D9AC38] uppercase mb-4">Planes Simples y Transparentes</div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-white">Elige el plan perfecto para tu barbería</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            
            {/* Basico */}
            <div className="bg-[#111315] border border-white/5 rounded-2xl p-8 flex flex-col">
              <h3 className="text-xl font-bold mb-1 text-white">Básico</h3>
              <p className="text-xs text-gray-500 mb-6">Para barberías que inician</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold font-serif text-white">$19</span>
                <span className="text-xs text-gray-500">/mes</span>
              </div>
              <p className="text-[10px] text-gray-600 mb-8 uppercase tracking-widest">Facturado mensualmente</p>
              
              <ul className="space-y-4 mb-8 text-sm text-gray-400 flex-1">
                <li className="flex items-start gap-3"><CheckCircle2 className="w-4 h-4 text-[#D9AC38] shrink-0 mt-0.5" /> Reservas online ilimitadas</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-4 h-4 text-[#D9AC38] shrink-0 mt-0.5" /> Gestión de 1-3 barberos</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-4 h-4 text-[#D9AC38] shrink-0 mt-0.5" /> Recordatorios automáticos</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-4 h-4 text-[#D9AC38] shrink-0 mt-0.5" /> Reportes básicos</li>
              </ul>
              
              <Link to="/register" className="block text-center w-full py-3 rounded-lg border border-white/10 text-white font-semibold hover:bg-white/5 transition-colors mt-auto">
                Comenzar ahora
              </Link>
            </div>

            {/* Profesional (Destacado) */}
            <div className="bg-gradient-to-b from-[#151719] to-[#111315] border border-[#D9AC38]/30 rounded-2xl p-8 relative flex flex-col transform md:-translate-y-4 shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#D9AC38] text-[#080A0C] text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full">
                Más popular
              </div>
              <h3 className="text-xl font-bold mb-1 text-white">Profesional</h3>
              <p className="text-xs text-gray-400 mb-6">Para barberías en crecimiento</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold font-serif text-[#D9AC38]">$39</span>
                <span className="text-xs text-gray-500">/mes</span>
              </div>
              <p className="text-[10px] text-gray-500 mb-8 uppercase tracking-widest">Facturado mensualmente</p>
              
              <ul className="space-y-4 mb-8 text-sm text-white flex-1">
                <li className="flex items-start gap-3"><CheckCircle2 className="w-4 h-4 text-[#D9AC38] shrink-0 mt-0.5" /> Todo lo del plan Básico</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-4 h-4 text-[#D9AC38] shrink-0 mt-0.5" /> Gestión de hasta 10 barberos</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-4 h-4 text-[#D9AC38] shrink-0 mt-0.5" /> Fidelización de clientes</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-4 h-4 text-[#D9AC38] shrink-0 mt-0.5" /> Reportes avanzados</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-4 h-4 text-[#D9AC38] shrink-0 mt-0.5" /> Control de inventario</li>
              </ul>
              
              <Link to="/register" className="block text-center w-full py-3 rounded-lg bg-[#D9AC38] text-[#080A0C] font-bold hover:bg-[#c29626] transition-colors shadow-[0_0_15px_rgba(217,172,56,0.2)] mt-auto">
                Comenzar ahora
              </Link>
            </div>

            {/* Premium */}
            <div className="bg-[#111315] border border-white/5 rounded-2xl p-8 flex flex-col">
              <h3 className="text-xl font-bold mb-1 text-white">Premium</h3>
              <p className="text-xs text-gray-500 mb-6">Para barberías grandes</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold font-serif text-white">$79</span>
                <span className="text-xs text-gray-500">/mes</span>
              </div>
              <p className="text-[10px] text-gray-600 mb-8 uppercase tracking-widest">Facturado mensualmente</p>
              
              <ul className="space-y-4 mb-8 text-sm text-gray-400 flex-1">
                <li className="flex items-start gap-3"><CheckCircle2 className="w-4 h-4 text-[#D9AC38] shrink-0 mt-0.5" /> Todo lo del plan Profesional</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-4 h-4 text-[#D9AC38] shrink-0 mt-0.5" /> Barberos ilimitados</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-4 h-4 text-[#D9AC38] shrink-0 mt-0.5" /> Integraciones avanzadas</li>
                <li className="flex items-start gap-3"><CheckCircle2 className="w-4 h-4 text-[#D9AC38] shrink-0 mt-0.5" /> Soporte prioritario 24/7</li>
              </ul>
              
              <Link to="/register" className="block text-center w-full py-3 rounded-lg border border-white/10 text-white font-semibold hover:bg-white/5 transition-colors mt-auto">
                Comenzar ahora
              </Link>
            </div>

            {/* Custom */}
            <div className="bg-[#080A0C] border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck className="w-5 h-5 text-[#D9AC38]" />
              </div>
              <h3 className="text-lg font-bold mb-3 text-white">¿Necesitas algo personalizado?</h3>
              <p className="text-sm text-gray-500 mb-8">Hablemos y diseñamos un plan a la medida de tu negocio.</p>
              <button className="w-full px-6 py-3 rounded-lg border border-white/20 text-white text-sm font-semibold hover:bg-white/5 transition-colors">
                Contactar ventas
              </button>
            </div>

          </div>
        </section>

        {/* 8. TESTIMONIOS */}
        <section id="benefits" className="py-24 max-w-7xl mx-auto px-6 lg:px-12 border-t border-white/5">
          <div className="text-center mb-16">
            <div className="text-[10px] font-bold tracking-[0.2em] text-[#D9AC38] uppercase mb-4">Lo que dicen nuestros clientes</div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-white">Historias reales de éxito</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-[#111315] p-8 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between">
                <div>
                   <div className="flex items-center gap-4 mb-6">
                      <img src="https://i.pravatar.cc/150?img=11" className="w-12 h-12 rounded-full border border-white/10 object-cover" alt="Carlos M." />
                      <div className="text-left">
                         <h4 className="font-bold text-white text-sm">Carlos M.</h4>
                         <p className="text-xs text-gray-500">Barbería Elite</p>
                      </div>
                   </div>
                   <p className="text-gray-400 text-sm italic mb-6 leading-relaxed">
                     "BarberFlow transformó nuestra manera de trabajar. Ahora tenemos más clientes felices y nuestro equipo está más organizado."
                   </p>
                </div>
                <div className="flex gap-1 text-[#D9AC38]">
                   <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
                </div>
             </div>
             
             <div className="bg-[#151719] p-8 rounded-2xl border border-[#D9AC38]/20 shadow-2xl flex flex-col justify-between transform md:-translate-y-4">
                <div>
                   <div className="flex items-center gap-4 mb-6">
                      <img src="https://i.pravatar.cc/150?img=33" className="w-12 h-12 rounded-full border border-white/10 object-cover" alt="Miguel A." />
                      <div className="text-left">
                         <h4 className="font-bold text-white text-sm">Miguel A.</h4>
                         <p className="text-xs text-gray-500">The Classic Barbershop</p>
                      </div>
                   </div>
                   <p className="text-gray-300 text-sm italic mb-6 leading-relaxed">
                     "La mejor inversión que hemos hecho. El sistema es intuitivo y el soporte es simplemente increíble."
                   </p>
                </div>
                <div className="flex gap-1 text-[#D9AC38]">
                   <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
                </div>
             </div>

             <div className="bg-[#111315] p-8 rounded-2xl border border-white/5 shadow-xl flex flex-col justify-between">
                <div>
                   <div className="flex items-center gap-4 mb-6">
                      <img src="https://i.pravatar.cc/150?img=12" className="w-12 h-12 rounded-full border border-white/10 object-cover" alt="Javier R." />
                      <div className="text-left">
                         <h4 className="font-bold text-white text-sm">Javier R.</h4>
                         <p className="text-xs text-gray-500">Urban Style</p>
                      </div>
                   </div>
                   <p className="text-gray-400 text-sm italic mb-6 leading-relaxed">
                     "Nuestros ingresos aumentaron 40% desde que implementamos BarberFlow en nuestra barbería. Totalmente recomendado."
                   </p>
                </div>
                <div className="flex gap-1 text-[#D9AC38]">
                   <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
                </div>
             </div>
          </div>
        </section>

        {/* 9. CTA FINAL */}
        <section className="pb-24 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-[#111315] to-[#151719] border border-[#D9AC38]/20 rounded-[2rem] p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-8 shadow-2xl relative overflow-hidden">
             <div className="absolute right-0 top-0 w-64 h-64 bg-[#D9AC38]/10 blur-[100px] rounded-full pointer-events-none" />
             <div className="relative z-10 max-w-xl">
               <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold mb-3 text-white">¿Listo para llevar tu barbería al siguiente nivel?</h2>
               <p className="text-gray-400 text-sm md:text-base">Únete a miles de barberos que ya están creciendo con BarberFlow.</p>
             </div>
             <Link to="/register" className="relative z-10 w-full md:w-auto whitespace-nowrap text-sm md:text-base font-bold bg-[#D9AC38] hover:bg-[#c29626] text-[#080A0C] px-8 py-4 rounded-full transition-all shadow-[0_0_20px_rgba(217,172,56,0.3)] flex items-center justify-center gap-2">
                Crear mi barbería gratis <ChevronRight className="w-5 h-5" />
             </Link>
          </div>
        </section>

      </main>

      {/* 10. FOOTER */}
      <footer className="bg-[#050608] border-t border-white/5 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-12 mb-16">
          <div className="lg:col-span-2">
             <div className="flex items-center gap-2 mb-6">
                <Scissors className="w-6 h-6 text-[#D9AC38]" />
                <span className="text-xl font-bold tracking-tight font-serif text-white">BarberFlow</span>
             </div>
             <p className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed">
               La plataforma operativa definitiva para barberías modernas y ambiciosas.
             </p>
             <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors text-gray-400 hover:text-white">IG</div>
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors text-gray-400 hover:text-white">FB</div>
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors text-gray-400 hover:text-white">X</div>
             </div>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-6 text-sm">Producto</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#features" className="hover:text-white transition-colors">Características</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Precios</a></li>
              <li><a href="#benefits" className="hover:text-white transition-colors">Beneficios</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Actualizaciones</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6 text-sm">Empresa</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white transition-colors">Nosotros</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Trabaja con nosotros</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Contacto</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6 text-sm">Recursos</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white transition-colors">Centro de ayuda</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Guías</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Estado del sistema</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6 text-sm">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white transition-colors">Términos y condiciones</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Política de privacidad</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Política de cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 text-xs text-gray-600">
          <p>© 2026 BarberFlow. Todos los derechos reservados.</p>
          <p className="mt-4 md:mt-0">Hecho con <span className="text-red-500">❤️</span> para barberos</p>
        </div>
      </footer>

    </div>
  );
}
