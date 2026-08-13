import { Link } from 'react-router-dom';
import { 
  Scissors, CalendarCheck, Users, ShieldCheck, 
  Smartphone, Clock, CheckCircle2, ChevronRight, Menu, X
} from 'lucide-react';
import { useState } from 'react';

export function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#D4AF37]/30 selection:text-white overflow-hidden">
      
      {/* --- BACKGROUND GLOWS --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#D4AF37]/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[30%] h-[30%] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
      
      {/* --- NAVBAR --- */}
      <nav className="relative z-50 flex items-center justify-between px-6 lg:px-12 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Scissors className="w-8 h-8 text-[#D4AF37]" />
          <span className="text-xl font-bold tracking-tight">BarberFlow</span>
        </div>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <a href="#features" className="hover:text-white transition-colors">Características</a>
          <a href="#architecture" className="hover:text-white transition-colors">Seguridad</a>
          <a href="#pricing" className="hover:text-white transition-colors">Precios</a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">
            Iniciar Sesión
          </Link>
          <Link to="/register" className="text-sm font-semibold bg-[#D4AF37] hover:bg-[#BBA036] text-black px-5 py-2.5 rounded-full transition-all hover:scale-105 active:scale-95">
            Crear mi barbería
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-gray-300 hover:text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8">
          <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-xl font-medium">Características</a>
          <a href="#architecture" onClick={() => setIsMenuOpen(false)} className="text-xl font-medium">Seguridad</a>
          <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-xl font-medium">Precios</a>
          <Link to="/login" className="text-xl font-medium">Iniciar Sesión</Link>
          <Link to="/register" className="text-xl font-semibold bg-[#D4AF37] text-black px-8 py-3 rounded-full mt-4">
            Crear mi barbería
          </Link>
        </div>
      )}

      {/* --- HERO SECTION --- */}
      <section className="relative z-10 pt-20 pb-32 px-6 lg:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300 mb-8 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
          El estándar premium para tu negocio
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight max-w-4xl">
          La plataforma operativa <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]">
            definitiva para barberías.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Gestiona reservas, personal y fideliza clientes con un ecosistema de alto rendimiento. Diseñado para escalar, creado para impresionar. Tu barbería, tus reglas.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link to="/register" className="flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#BBA036] text-black font-semibold text-lg px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(212,175,55,0.5)]">
            Comenzar gratis <ChevronRight className="w-5 h-5" />
          </Link>
          <Link to="/login" className="flex items-center justify-center bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold text-lg px-8 py-4 rounded-xl transition-all">
            Ingresar al Dashboard
          </Link>
        </div>

        {/* Dashboard Mockup (CSS) */}
        <div className="mt-24 w-full max-w-5xl relative">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-20 pointer-events-none" />
          <div className="rounded-2xl border border-white/10 bg-[#121212]/80 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col transform perspective-1000 rotate-x-12 scale-100 md:scale-105 transition-transform duration-700 hover:rotate-x-0">
            {/* Header Mockup */}
            <div className="h-12 border-b border-white/5 flex items-center px-4 gap-2 bg-black/40">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            {/* Body Mockup */}
            <div className="flex h-64 md:h-96">
              {/* Sidebar */}
              <div className="w-1/4 border-r border-white/5 bg-black/20 p-4 hidden md:flex flex-col gap-3">
                <div className="h-4 w-2/3 bg-white/10 rounded-md mb-6" />
                <div className="h-3 w-full bg-[#D4AF37]/20 rounded-md" />
                <div className="h-3 w-4/5 bg-white/5 rounded-md" />
                <div className="h-3 w-full bg-white/5 rounded-md" />
              </div>
              {/* Main Area */}
              <div className="flex-1 p-6 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-1/4 bg-white/10 rounded-md" />
                  <div className="h-8 w-24 bg-[#D4AF37] rounded-md" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 h-24 bg-white/5 rounded-xl border border-white/5 p-4 flex flex-col justify-between">
                    <div className="h-3 w-1/3 bg-white/10 rounded" />
                    <div className="h-6 w-1/2 bg-white/20 rounded" />
                  </div>
                  <div className="flex-1 h-24 bg-white/5 rounded-xl border border-white/5 p-4 flex flex-col justify-between">
                    <div className="h-3 w-1/3 bg-white/10 rounded" />
                    <div className="h-6 w-1/2 bg-white/20 rounded" />
                  </div>
                  <div className="flex-1 h-24 bg-white/5 rounded-xl border border-white/5 p-4 hidden sm:flex flex-col justify-between">
                    <div className="h-3 w-1/3 bg-[#D4AF37]/50 rounded" />
                    <div className="h-6 w-1/2 bg-[#D4AF37]/80 rounded" />
                  </div>
                </div>
                <div className="flex-1 bg-white/5 rounded-xl border border-white/5 mt-2" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES BENTO GRID --- */}
      <section id="features" className="relative z-10 py-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Todo lo que necesitas, <span className="text-[#D4AF37]">sin fricción.</span></h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">Sustituye la agenda de papel, los mensajes de WhatsApp y las hojas de cálculo por una suite integrada.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 (Large) */}
          <div className="md:col-span-2 bg-[#121212] border border-white/10 rounded-3xl p-8 hover:border-[#D4AF37]/50 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <CalendarCheck className="w-32 h-32 text-[#D4AF37]" />
            </div>
            <h3 className="text-2xl font-bold mb-3 relative z-10">Gestión de Citas Inteligente</h3>
            <p className="text-gray-400 mb-8 max-w-md relative z-10">Tus clientes reservan 24/7 en tu propia página pública. El sistema calcula huecos automáticamente respetando los horarios y duración de cada barbero.</p>
            <div className="bg-black/50 border border-white/5 rounded-xl p-4 flex gap-4 w-fit relative z-10">
              <div className="bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-md text-sm font-medium">10:00 AM - Corte Clásico</div>
              <div className="bg-white/5 text-gray-400 px-3 py-1 rounded-md text-sm font-medium">11:00 AM - Disponible</div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#121212] border border-white/10 rounded-3xl p-8 hover:border-[#D4AF37]/50 transition-colors group">
            <Users className="w-10 h-10 text-[#D4AF37] mb-6" />
            <h3 className="text-xl font-bold mb-3">CRM de Clientes</h3>
            <p className="text-gray-400">Mantén el historial de visitas, LTV y notas privadas para ofrecer un servicio ultrapersonalizado en cada corte.</p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#121212] border border-white/10 rounded-3xl p-8 hover:border-[#D4AF37]/50 transition-colors group">
            <Smartphone className="w-10 h-10 text-[#D4AF37] mb-6" />
            <h3 className="text-xl font-bold mb-3">Tu Enlace Público</h3>
            <p className="text-gray-400">Obtén un portal elegante (ej. barberflow.com/booking/tu-barberia) optimizado para convertir visitas de Instagram en citas.</p>
          </div>

          {/* Card 4 (Large) */}
          <div className="md:col-span-2 bg-[#121212] border border-white/10 rounded-3xl p-8 hover:border-[#D4AF37]/50 transition-colors group flex flex-col justify-center">
            <Clock className="w-10 h-10 text-[#D4AF37] mb-6" />
            <h3 className="text-2xl font-bold mb-3">Control de Personal</h3>
            <p className="text-gray-400 max-w-xl">Configura días laborables y horarios exactos por cada miembro de tu equipo. El sistema nunca solapará citas y optimizará el tiempo muerto.</p>
          </div>
        </div>
      </section>

      {/* --- MULTI-TENANT ARCHITECTURE (Business perspective) --- */}
      <section id="architecture" className="relative z-10 py-24 px-6 lg:px-12 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Seguridad de grado empresarial. <br/><span className="text-gray-500">Aislamiento total.</span></h2>
            <p className="text-gray-400 text-lg mb-8">
              Tu base de datos de clientes, finanzas y configuración está blindada. En BarberFlow, cada barbería opera en un entorno criptográficamente aislado (Multi-Tenant).
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-gray-300">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" /> Privacidad de datos absoluta entre barberías.
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" /> Arquitectura que evita Overbooking matemáticamente.
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" /> Infraestructura Cloud lista para soportar picos de demanda.
              </li>
            </ul>
          </div>
          <div className="md:w-1/2 w-full relative">
            <div className="absolute inset-0 bg-[#D4AF37]/5 blur-[100px] rounded-full" />
            <div className="grid grid-cols-2 gap-4 relative z-10">
              {/* Visual abstraction of tenants */}
              <div className="bg-[#121212] border border-[#D4AF37]/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(212,175,55,0.1)]">
                <div className="h-2 w-12 bg-[#D4AF37] rounded mb-4" />
                <div className="text-sm text-gray-400 mb-2">Tenant A</div>
                <div className="text-white font-medium">The Gentleman</div>
              </div>
              <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 opacity-50 translate-y-8">
                <div className="h-2 w-12 bg-white/20 rounded mb-4" />
                <div className="text-sm text-gray-500 mb-2">Tenant B</div>
                <div className="text-gray-400 font-medium">Urban Cuts</div>
              </div>
              <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 opacity-30 -translate-y-4">
                <div className="h-2 w-12 bg-white/20 rounded mb-4" />
                <div className="text-sm text-gray-600 mb-2">Tenant C</div>
              </div>
              <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 opacity-40 translate-y-4">
                <div className="h-2 w-12 bg-white/20 rounded mb-4" />
                <div className="text-sm text-gray-600 mb-2">Tenant D</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="relative z-10 py-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Planes simples y transparentes.</h2>
          <p className="text-gray-400 text-lg">Diseñado para crecer contigo, desde un sillón hasta múltiples franquicias.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Plan 1 */}
          <div className="bg-[#121212] border border-white/10 rounded-3xl p-8 flex flex-col">
            <h3 className="text-xl font-medium text-gray-300 mb-2">Solo</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold">$19</span>
              <span className="text-gray-500">/mes</span>
            </div>
            <p className="text-gray-400 text-sm mb-8">Perfecto para barberos independientes que buscan orden.</p>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> 1 Barbero</li>
              <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> Citas Ilimitadas</li>
              <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> Portal Público</li>
            </ul>
            <Link to="/register" className="w-full py-3 rounded-xl border border-white/20 text-center font-medium hover:bg-white/5 transition-colors">Empezar</Link>
          </div>

          {/* Plan 2 (Pro) */}
          <div className="bg-gradient-to-b from-[#1a1a1a] to-[#121212] border border-[#D4AF37]/50 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-[0_0_30px_rgba(212,175,55,0.15)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#D4AF37] text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Popular
            </div>
            <h3 className="text-xl font-medium text-[#D4AF37] mb-2">Shop</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold">$49</span>
              <span className="text-gray-500">/mes</span>
            </div>
            <p className="text-gray-400 text-sm mb-8">Para barberías establecidas con un equipo en crecimiento.</p>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-white"><CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> Hasta 5 Barberos</li>
              <li className="flex items-center gap-3 text-sm text-white"><CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> CRM Avanzado</li>
              <li className="flex items-center gap-3 text-sm text-white"><CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> Métricas y Reportes</li>
              <li className="flex items-center gap-3 text-sm text-white"><CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> Soporte Prioritario</li>
            </ul>
            <Link to="/register" className="w-full py-3 rounded-xl bg-[#D4AF37] hover:bg-[#BBA036] text-black text-center font-bold transition-colors">Prueba Gratuita</Link>
          </div>

          {/* Plan 3 */}
          <div className="bg-[#121212] border border-white/10 rounded-3xl p-8 flex flex-col">
            <h3 className="text-xl font-medium text-gray-300 mb-2">Franquicia</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold">$99</span>
              <span className="text-gray-500">/mes</span>
            </div>
            <p className="text-gray-400 text-sm mb-8">Para marcas con alto volumen de clientes y personal.</p>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> Barberos Ilimitados</li>
              <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> Múltiples Locales</li>
              <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> API Access</li>
            </ul>
            <Link to="/register" className="w-full py-3 rounded-xl border border-white/20 text-center font-medium hover:bg-white/5 transition-colors">Contactar Ventas</Link>
          </div>
        </div>
      </section>

      {/* --- BOTTOM CTA --- */}
      <section className="relative z-10 py-24 px-6 lg:px-12 text-center">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#1a1a1a] to-[#121212] border border-white/10 rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[#D4AF37]/5 blur-[100px] pointer-events-none" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">Eleva el nivel de tu barbería hoy.</h2>
          <p className="text-gray-400 mb-8 relative z-10 max-w-xl mx-auto">Únete a cientos de barberos que ya están optimizando su tiempo y aumentando sus ingresos con BarberFlow.</p>
          <Link to="/register" className="relative z-10 inline-flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#BBA036] text-black font-semibold text-lg px-8 py-4 rounded-xl transition-all hover:scale-105">
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6 lg:px-12 text-center md:text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-gray-500" />
            <span className="text-gray-400 font-medium">BarberFlow © 2026</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
