import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../../infrastructure/supabase/client';
import { useAuth } from './AuthContext';
import { Mail, Lock, Calendar, BarChart2, Users, ArrowRight, Loader2 } from 'lucide-react';

export function LoginPage() {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && session) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message === 'Invalid login credentials' 
        ? 'Credenciales incorrectas. Verifica tu email y contraseña.' 
        : error.message);
      setIsSubmitting(false);
    } else {
      navigate('/admin');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-[#121212] text-white font-sans selection:bg-[#D4AF37] selection:text-black">
      
      {/* LEFT COLUMN: BRANDING & IMAGE */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        {/* Background Image (Covering entirely) */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("/images/login-bg.jpg")' }}
        />
        {/* CRITICAL OVERLAY: Oscurece el lado izquierdo para el texto, pero deja ver la imagen a la derecha */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/20" />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/images/logo.png" alt="BarberFlow" className="h-8 object-contain" />
          <span className="text-xl font-bold tracking-wide">BarberFlow</span>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 max-w-md mt-20 mb-10">
          <h1 className="text-[3.2rem] font-extrabold leading-[1.1] tracking-tight mb-6 text-white">
            Gestiona tu<br/>barbería como<br/>un <span className="text-[#D4AF37]">profesional.</span>
          </h1>
          <p className="text-[15px] text-zinc-400 font-medium leading-relaxed max-w-sm">
            Sistema exclusivo de administración. Accede a tu panel para visualizar tus ingresos y organizar tus citas.
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-7 mt-auto mb-10">
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-black/40 border border-[#D4AF37]/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
              <Calendar className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div className="pt-1">
              <h3 className="font-bold text-[14px] text-white mb-1">Reservas 24/7</h3>
              <p className="text-[12px] text-zinc-500 leading-relaxed max-w-[260px]">
                Gestión automatizada de tu agenda.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-black/40 border border-[#D4AF37]/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
              <BarChart2 className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div className="pt-1">
              <h3 className="font-bold text-[14px] text-white mb-1">Panel Administrativo</h3>
              <p className="text-[12px] text-zinc-500 leading-relaxed max-w-[260px]">
                Control total sobre tu negocio de forma privada.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-black/40 border border-[#D4AF37]/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
              <Users className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div className="pt-1">
              <h3 className="font-bold text-[14px] text-white mb-1">Clientes Felices</h3>
              <p className="text-[12px] text-zinc-500 leading-relaxed max-w-[260px]">
                Brinda una experiencia premium.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-zinc-600 text-xs font-medium">
          © {new Date().getFullYear()} Panel Administrativo Interno.
        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-[#121212]">
        
        {/* Glow effect behind the card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-[440px] bg-[#161616] border border-white/5 rounded-3xl p-10 shadow-2xl relative z-10">
          
          {/* Logo Center */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#121212] border border-[#D4AF37]/40 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.15)]">
              <img src="/images/logo.png" alt="Icon" className="h-8 object-contain" />
            </div>
          </div>

          <div className="text-center space-y-2 mb-10">
            <h2 className="text-[26px] font-bold tracking-tight text-white">
              Bienvenido de <span className="text-[#D4AF37]">vuelta</span>
            </h2>
            <p className="text-[13px] text-zinc-400 font-medium">
              Ingresa tus credenciales para acceder al panel.
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-white/90 pl-1" htmlFor="email">
                Correo Electrónico
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 transition-colors group-focus-within:text-[#D4AF37]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#0a0a0a] border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all text-sm placeholder:text-zinc-600 text-white"
                  placeholder="admin@barberia.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between pl-1 pr-1">
                <label className="text-[13px] font-semibold text-white/90" htmlFor="password">
                  Contraseña
                </label>
                <a href="#" className="text-[12px] font-medium text-[#D4AF37] hover:text-amber-400 transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 transition-colors group-focus-within:text-[#D4AF37]" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#0a0a0a] border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all text-sm placeholder:text-zinc-600 text-white tracking-widest"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pl-1 pt-1 pb-3">
              <input 
                type="checkbox" 
                id="remember" 
                className="w-4 h-4 rounded border-white/20 bg-[#0a0a0a] text-[#D4AF37] focus:ring-[#D4AF37] focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer" 
              />
              <label htmlFor="remember" className="text-[12px] text-zinc-400 cursor-pointer select-none">
                Recordarme por 30 días
              </label>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#D4AF37] text-black font-bold py-3.5 rounded-xl transition-all duration-300 hover:bg-[#E5C158] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px]"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Iniciar Sesión <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
