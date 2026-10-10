import { Navigate, Outlet } from 'react-router-dom';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';

export function ProtectedRoute() {
  const {
    session,
    isLoading,
    tenantResolutionStatus,
    tenantResolutionError,
    refreshTenantResolution,
  } = useAuth();

  if (isLoading || (session && ['idle', 'loading'].includes(tenantResolutionStatus))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  if (tenantResolutionStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h1 className="text-xl font-bold">No pudimos verificar tu barbería</h1>
          <p className="text-sm text-muted-foreground">{tenantResolutionError}</p>
          <button
            type="button"
            onClick={() => void refreshTenantResolution()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground"
          >
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (tenantResolutionStatus === 'needs_onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
