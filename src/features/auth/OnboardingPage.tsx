import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, Link as LinkIcon, Loader2, RefreshCw, Store } from 'lucide-react';
import { useAuth } from './AuthContext';
import { onboardingRepository } from '../../infrastructure/supabase/repositories/onboarding.repository';
import { sanitizeSlug, slugifyShopName } from './onboarding.utils';
import { notifications } from '../../shared/lib/notifications';

export function OnboardingPage() {
  const {
    session,
    isLoading,
    tenantResolutionStatus,
    tenantResolutionError,
    refreshTenantResolution,
  } = useAuth();
  const navigate = useNavigate();
  const initialName = String(session?.user.user_metadata?.shop_name ?? '');
  const initialSlug = String(
    session?.user.user_metadata?.shop_slug ?? slugifyShopName(initialName)
  );
  const [shopName, setShopName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [slugWasEdited, setSlugWasEdited] = useState(Boolean(initialSlug));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionLock = useRef(false);
  const prefilledUserId = useRef<string | null>(session?.user.id ?? null);

  useEffect(() => {
    if (!session || prefilledUserId.current === session.user.id) return;

    const metadataName = String(session.user.user_metadata?.shop_name ?? '');
    const metadataSlug = String(session.user.user_metadata?.shop_slug ?? '');
    setShopName(metadataName);
    setSlug(metadataSlug || slugifyShopName(metadataName));
    setSlugWasEdited(Boolean(metadataSlug));
    prefilledUserId.current = session.user.id;
  }, [session]);

  useEffect(() => {
    if (!slugWasEdited) setSlug(slugifyShopName(shopName));
  }, [shopName, slugWasEdited]);

  if (isLoading || ['idle', 'loading'].includes(tenantResolutionStatus)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37] mx-auto" />
          <p className="text-sm text-zinc-400">Verificando tu cuenta y barbería…</p>
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  if (tenantResolutionStatus === 'ready') return <Navigate to="/admin" replace />;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submissionLock.current || !shopName.trim() || !slug.trim()) return;

    submissionLock.current = true;
    setIsSubmitting(true);

    try {
      const resolution = await onboardingRepository.complete(shopName.trim(), slug.trim());
      if (resolution.status !== 'ready') {
        throw new Error('No se pudo completar la asociación con tu barbería.');
      }
      await refreshTenantResolution();
      notifications.success('Barbería configurada', {
        description: 'Ya puedes administrar tu negocio desde el panel.',
      });
      navigate('/admin', { replace: true });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : '';
      if (message.includes('SLUG_TAKEN') || message.includes('duplicate key')) {
        notifications.warning('El enlace ya está ocupado', {
          description: 'Elige un enlace público diferente para continuar.',
        });
      } else if (message.includes('ONBOARDING_AMBIGUOUS')) {
        notifications.error('Tu cuenta requiere revisión', {
          description: 'Contacta a soporte para verificar la asociación de tu barbería.',
          duration: 6500,
        });
      } else {
        notifications.error('No pudimos completar la configuración', {
          description: 'Revisa tu conexión e inténtalo nuevamente.',
        });
      }
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  };

  if (tenantResolutionStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212] p-6 text-white">
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h1 className="text-2xl font-bold">No pudimos recuperar tu barbería</h1>
          <p className="text-sm text-zinc-400">{tenantResolutionError}</p>
          <button
            type="button"
            onClick={() => void refreshTenantResolution()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 font-bold text-black"
          >
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-[#121212] text-white font-sans selection:bg-[#D4AF37] selection:text-black">
      <div className="w-full max-w-md mx-auto mt-20 p-8">
        <div className="text-center mb-10">
          <Store className="w-16 h-16 mx-auto text-[#D4AF37] mb-6" />
          <h1 className="text-3xl font-bold tracking-tight mb-3">Completa tu Barbería</h1>
          <p className="text-gray-400">
            No encontramos una barbería asociada a tu cuenta. Confirma los datos faltantes para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1" htmlFor="onboarding-shop-name">
              Nombre de la Barbería
            </label>
            <input
              id="onboarding-shop-name"
              type="text"
              required
              value={shopName}
              onChange={(event) => setShopName(event.target.value)}
              className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors text-white"
              placeholder="Ej. The Gentleman's Barber"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1" htmlFor="onboarding-slug">
              Tu Enlace Público
            </label>
            <div className="flex relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <LinkIcon className="h-5 w-5 text-gray-500" />
              </div>
              <input
                id="onboarding-slug"
                type="text"
                required
                value={slug}
                onChange={(event) => {
                  setSlugWasEdited(true);
                  setSlug(sanitizeSlug(event.target.value));
                }}
                className="w-full bg-[#1A1A1A] border border-gray-800 rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:border-[#D4AF37] transition-colors text-white"
                placeholder="tu-barberia"
                disabled={isSubmitting}
              />
            </div>
            {slug && (
              <p className="text-xs text-[#D4AF37] mt-2 ml-1">
                Tus clientes reservarán en:{' '}
                <span className="font-mono bg-black/50 px-2 py-1 rounded">barberflow.com/booking/{slug}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !shopName.trim() || !slug.trim()}
            className="w-full bg-[#D4AF37] hover:bg-[#BBA036] text-black font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /><span>Configurando…</span></>
            ) : (
              <span>Finalizar y entrar</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
