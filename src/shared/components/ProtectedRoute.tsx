import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../infrastructure/supabase/client';

export function ProtectedRoute() {
  const { session, isLoading } = useAuth();
  const [hasTenant, setHasTenant] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkTenant() {
      if (!session) return;
      try {
        const { data, error } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', session.user.id).maybeSingle();
        if (data && !error) {
          setHasTenant(true);
        } else {
          setHasTenant(false);
        }
      } catch (e) {
        setHasTenant(false);
      }
    }
    
    if (session) {
      checkTenant();
    }
  }, [session]);

  if (isLoading || (session && hasTenant === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    // Si no hay sesión, redirigir al login
    return <Navigate to="/login" replace />;
  }

  if (hasTenant === false) {
    // Si está autenticado pero no tiene tenant, enviarlo al onboarding
    return <Navigate to="/onboarding" replace />;
  }

  // Si está autenticado y tiene tenant, renderizar las rutas hijas (el Layout del Admin)
  return <Outlet />;
}
