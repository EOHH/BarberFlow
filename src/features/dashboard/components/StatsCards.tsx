import { Calendar, DollarSign, Activity } from 'lucide-react';

interface Props {
  totalAppointments: number;
  estimatedRevenue: number;
  activeServicesCount: number;
}

export function StatsCards({ totalAppointments, estimatedRevenue, activeServicesCount }: Props) {
  const cards = [
    {
      title: 'Citas de Hoy',
      value: totalAppointments.toString(),
      icon: Calendar,
      description: 'Total agendado para hoy',
    },
    {
      title: 'Ingreso Estimado (Hoy)',
      value: `$${estimatedRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: 'Basado en citas confirmadas/pendientes',
    },
    {
      title: 'Servicios Activos',
      value: activeServicesCount.toString(),
      icon: Activity,
      description: 'En el catálogo',
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-8">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div key={i} className="bg-card p-6 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">{card.title}</h3>
              <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </div>
        );
      })}
    </div>
  );
}
