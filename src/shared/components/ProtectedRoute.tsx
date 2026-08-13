import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
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

  // Si está autenticado, renderizar las rutas hijas (el Layout del Admin)
  return <Outlet />;
}
