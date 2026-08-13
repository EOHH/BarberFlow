import type { Appointment, Service } from '../../../types';

interface Props {
  appointments: Appointment[];
  services: Service[];
  onUpdateStatus: (id: string, status: 'pending' | 'confirmed' | 'cancelled') => void;
  isLoading: boolean;
}

export function AppointmentsTable({ appointments, services, onUpdateStatus, isLoading }: Props) {
  if (isLoading) {
    return <div className="h-64 flex items-center justify-center text-muted-foreground">Cargando citas...</div>;
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-card border rounded-xl p-8 text-center">
        <p className="text-muted-foreground">No hay citas registradas para este día.</p>
      </div>
    );
  }

  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Servicio Desconocido';

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'confirmed':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Confirmada</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Cancelada</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pendiente</span>;
    }
  };

  return (
    <div className="bg-card border rounded-xl overflow-hidden shadow-sm overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted text-muted-foreground text-xs uppercase">
          <tr>
            <th className="px-6 py-4 font-medium">Hora</th>
            <th className="px-6 py-4 font-medium">Cliente</th>
            <th className="px-6 py-4 font-medium">Teléfono</th>
            <th className="px-6 py-4 font-medium">Servicio</th>
            <th className="px-6 py-4 font-medium">Estado</th>
            <th className="px-6 py-4 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {appointments.map((app) => (
            <tr key={app.id} className="hover:bg-muted/50 transition-colors">
              <td className="px-6 py-4 font-semibold whitespace-nowrap">{formatTime(app.time)}</td>
              <td className="px-6 py-4 whitespace-nowrap">{app.client_name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{app.phone}</td>
              <td className="px-6 py-4 whitespace-nowrap">{getServiceName(app.service_id)}</td>
              <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(app.status)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                {app.status === 'pending' && (
                  <button 
                    onClick={() => onUpdateStatus(app.id, 'confirmed')}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Confirmar
                  </button>
                )}
                {app.status !== 'cancelled' && (
                  <button 
                    onClick={() => onUpdateStatus(app.id, 'cancelled')}
                    className="text-xs font-medium text-destructive hover:underline"
                  >
                    Cancelar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
