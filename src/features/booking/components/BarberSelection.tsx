import type { Barber } from '../../../types';
import { User, Star } from 'lucide-react';
import { usePublicTenant } from '../../../shared/hooks/usePublicTenant';
import { getThemeClasses } from '../../../shared/utils/theme';

interface Props {
  barbers: Barber[];
  selectedBarberId?: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export function BarberSelection({ barbers, selectedBarberId, onSelect, isLoading }: Props) {
  const { tenant } = usePublicTenant();
  const theme = getThemeClasses(tenant?.theme_color);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-5 p-5 bg-card border border-border/40 rounded-3xl animate-pulse">
            <div className="w-20 h-20 rounded-full bg-muted/60 shrink-0"></div>
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-muted/60 rounded-md w-3/4"></div>
              <div className="h-4 bg-muted/60 rounded-md w-1/2"></div>
            </div>
            <div className="w-6 h-6 rounded-full bg-muted/60 shrink-0"></div>
          </div>
        ))}
      </div>
    );
  }

  if (barbers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <User className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground text-sm font-medium">No hay barberos disponibles.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {barbers.map((barber) => {
        const isSelected = selectedBarberId === barber.id;
        const rating = barber.rating || 5.0;
        
        return (
          <button
            key={barber.id}
            onClick={() => onSelect(barber.id)}
            className={`relative overflow-hidden w-full text-left p-5 rounded-3xl transition-all duration-300 flex items-center gap-5 border ${
              isSelected
                ? `bg-[#141414] text-white ${theme.border} shadow-lg shadow-black/40`
                : 'bg-[#141414] text-white border-zinc-800 shadow-sm hover:border-zinc-600'
            }`}
          >
            {isSelected && (
              <div className={`absolute inset-0 opacity-5 ${theme.bg}`} />
            )}

            {/* Avatar Profile */}
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center shrink-0 overflow-hidden border-2 ${
              isSelected ? theme.border : 'border-zinc-800'
            }`}>
              {barber.avatar_url ? (
                <img 
                  src={barber.avatar_url} 
                  alt={barber.name} 
                  className="w-full h-full object-cover aspect-square"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${isSelected ? theme.bgLight : 'bg-zinc-800 text-zinc-500'}`}>
                  <User className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg md:text-xl text-white truncate">
                {barber.name}
              </h3>
              <p className="text-[13px] md:text-[14px] font-medium mt-0.5 text-zinc-400 truncate">
                {barber.specialty || 'Fade y Barba'}
              </p>
              
              <div className="flex items-center gap-1.5 mt-2">
                <Star className={`w-4 h-4 fill-amber-400 text-amber-400`} />
                <span className="text-[13px] font-bold text-white">{rating.toFixed(1)}</span>
                <span className="text-[12px] text-zinc-500">(Verificado)</span>
              </div>
            </div>
            
            {/* Custom Radio Circle */}
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              isSelected ? theme.border : 'border-zinc-700'
            }`}>
              {isSelected && <div className={`w-3 h-3 rounded-full ${theme.bg}`} />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
