import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../../infrastructure/supabase/client';
import { useAuth } from './AuthContext';
import { Store, Loader2, Link as LinkIcon } from 'lucide-react';

export function OnboardingPage() {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const [shopName, setShopName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingTenant, setCheckingTenant] = useState(true);

  // Generador de slug automático a partir del nombre
  useEffect(() => {
    if (shopName) {
      const generatedSlug = shopName
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remover acentos
        .replace(/[^a-z0-9]/g, '-') // reemplazar no-alfanuméricos con guiones
        .replace(/-+/g, '-') // colapsar guiones múltiples
        .replace(/^-|-$/g, ''); // quitar guiones de los extremos
      setSlug(generatedSlug);
    } else {
      setSlug('');
    }
  }, [shopName]);

  // Verificar si el usuario ya tiene tenant
  useEffect(() => {
    async function checkExistingTenant() {
      if (!session) return;
      try {
        const { data, error } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', session.user.id).maybeSingle();
        if (data && !error) {
          // Ya tiene tenant, redirigir a dashboard
          navigate('/admin');
        }
      } catch (e) {
        // Ignorar
      } finally {
        setCheckingTenant(false);
      }
    }
    
    if (!isLoading && session) {
      checkExistingTenant();
    } else if (!isLoading && !session) {
      setCheckingTenant(false);
    }
  }, [session, isLoading, navigate]);

  if (isLoading || checkingTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName || !slug) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      // Llamar a la RPC segura
      const { error } = await supabase.rpc('onboard_tenant', {
        p_shop_name: shopName,
        p_slug: slug
      });

      if (error) {
        throw new Error(error.message);
      }

      // Éxito, redirigir al admin
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Error al crear la barbería. Intenta con otro nombre.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#121212] text-white font-sans selection:bg-[#D4AF37] selection:text-black">
      <div className="w-full max-w-md mx-auto mt-20 p-8">
        <div className="text-center mb-10">
          <Store className="w-16 h-16 mx-auto text-[#D4AF37] mb-6" />
          <h1 className="text-3xl font-bold tracking-tight mb-3">Crea tu Barbería</h1>
          <p className="text-gray-400">
            Falta un paso más. Ingresa el nombre de tu barbería para generar tu página pública de reservas.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Nombre de la Barbería</label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors text-white"
              placeholder="Ej. The Gentleman's Barber"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Tu Enlace Público</label>
            <div className="flex relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <LinkIcon className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors text-white"
                placeholder="tu-barberia"
                disabled={isSubmitting}
              />
            </div>
            {slug && (
              <p className="text-xs text-[#D4AF37] mt-2 ml-1">
                Tus clientes reservarán en: <span className="font-mono bg-black/50 px-2 py-1 rounded">barberflow.com/booking/{slug}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !shopName || !slug}
            className="w-full bg-[#D4AF37] hover:bg-[#BBA036] text-black font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creando barbería...</span>
              </>
            ) : (
              <span>Finalizar y Entrar</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
