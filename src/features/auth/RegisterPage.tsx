import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { supabase } from '../../infrastructure/supabase/client';
import { useAuth } from './AuthContext';
import { Store, Mail, Lock, Eye, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

export function RegisterPage() {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isLoading && session) {
    return <Navigate to="/admin" replace />;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          shop_name: shopName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setIsSubmitting(false);
    } else if (data.session) {
      navigate('/onboarding');
    } else {
      // Confirmación de email requerida
      alert('¡Registro exitoso! Por favor, verifica tu correo electrónico para continuar.');
      navigate('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  // Password validation checks
  const hasMinLength = password.length >= 6;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isStrong = hasMinLength && hasUppercase && hasNumber;

  return (
    <div className="min-h-screen w-full flex bg-[#121212] text-white font-sans selection:bg-[#D4AF37] selection:text-black">
      
      {/* LEFT COLUMN: BRANDING & IMAGE */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        {/* Background Image (Covering entirely) */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("/images/register-bg.jpg")' }}
        />
        {/* CRITICAL OVERLAY: Oscurece el lado izquierdo para el texto, pero deja ver la imagen a la derecha */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/20" />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/images/logo.png" alt="BarberFlow" className="h-9 object-contain" />
          <span className="text-[22px] font-bold tracking-wide">BarberFlow</span>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 max-w-sm mt-24 mb-10">
          <h1 className="text-[3.2rem] font-extrabold leading-[1.1] tracking-tight mb-6 text-white">
            Configuración<br/>de <span className="text-[#D4AF37]">Sistema</span><br/>Interno.
          </h1>
          <p className="text-[14px] text-zinc-400 font-medium leading-relaxed">
            Inicialización del sistema administrativo y motor de reservas. Uso exclusivo interno.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: REGISTER FORM */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative bg-[#121212] overflow-y-auto">
        
        <div className="w-full max-w-[460px] bg-[#161616] border border-white/5 rounded-3xl p-10 shadow-2xl relative z-10 my-auto">
          
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-[26px] font-bold tracking-tight text-white">
              Crea tu <span className="text-[#D4AF37]">Barbería</span>
            </h2>
            <p className="text-[13px] text-zinc-400 font-medium">
              Configura tu acceso administrativo gratis.
            </p>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-5">
            
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-white/90 pl-1" htmlFor="shopName">
                Nombre de la Barbería
              </label>
              <div className="relative group">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 transition-colors group-focus-within:text-[#D4AF37]" />
                <input
                  id="shopName"
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#0a0a0a] border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all text-sm placeholder:text-zinc-600 text-white"
                  placeholder="Ej. The Classic Cut"
                  required
                />
              </div>
            </div>

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
              <label className="text-[13px] font-semibold text-white/90 pl-1" htmlFor="password">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 transition-colors group-focus-within:text-[#D4AF37]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-[#0a0a0a] border border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all text-sm placeholder:text-zinc-600 text-white tracking-widest"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Password Security Meter */}
            <div className="pt-3 pb-4 space-y-3">
              <div className="flex gap-1.5">
                <div className={`h-1 flex-1 rounded-full ${hasMinLength ? 'bg-green-500' : 'bg-white/10'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${hasUppercase ? 'bg-green-500' : 'bg-white/10'}`}></div>
                <div className={`h-1 flex-1 rounded-full ${hasNumber ? 'bg-green-500' : 'bg-white/10'}`}></div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] text-zinc-400 font-medium">Seguridad:</span>
                <span className={`text-[12px] font-bold ${isStrong ? 'text-green-500' : 'text-zinc-400'}`}>
                  {isStrong ? 'Fuerte' : 'Débil'}
                </span>
              </div>
              
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? 'text-green-500' : 'text-white/20'}`} />
                  <span className={`text-[11px] ${hasMinLength ? 'text-zinc-300' : 'text-zinc-500'}`}>Debe contener al menos 6 caracteres</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${hasUppercase ? 'text-green-500' : 'text-white/20'}`} />
                  <span className={`text-[11px] ${hasUppercase ? 'text-zinc-300' : 'text-zinc-500'}`}>Una mayúscula</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${hasNumber ? 'text-green-500' : 'text-white/20'}`} />
                  <span className={`text-[11px] ${hasNumber ? 'text-zinc-300' : 'text-zinc-500'}`}>Un número</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !isStrong}
              className="w-full bg-[#D4AF37] text-black font-bold py-3.5 rounded-xl transition-all duration-300 hover:bg-[#E5C158] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[15px] mt-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Crear mi Barbería <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
          
          <div className="pt-8 text-center mt-2">
            <p className="text-[13px] text-zinc-400">
              ¿Ya tienes tu barbería configurada?{' '}
              <Link to="/login" className="text-[#D4AF37] font-semibold hover:text-amber-400 transition-colors ml-1">
                Inicia Sesión
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
