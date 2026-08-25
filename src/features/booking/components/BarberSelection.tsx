import type { Barber } from '../../../types';
import { User, Star, Crown, ShieldCheck, ArrowRight } from 'lucide-react';
import type { ThemeClasses } from '../../../shared/utils/theme';

interface Props {
  barbers: Barber[];
  selectedBarberId?: string;
  onSelect: (id: string) => void;
  onContinue?: () => void;
  isLoading: boolean;
  theme: ThemeClasses;
}

export function BarberSelection({ barbers, selectedBarberId, onSelect, onContinue, isLoading, theme }: Props) {

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-5 p-5 bg-[#0a0a0a] border border-zinc-800/40 rounded-3xl animate-pulse">
            <div className="w-20 h-20 rounded-full bg-zinc-800/60 shrink-0"></div>
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-zinc-800/60 rounded-md w-3/4"></div>
              <div className="h-4 bg-zinc-800/60 rounded-md w-1/2"></div>
            </div>
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
    <div className="flex flex-col h-full relative">
      <div className="grid grid-cols-1 gap-5 pb-6">
        {barbers.map((barber, index) => {
          const isSelected = selectedBarberId === barber.id;
          const rating = barber.rating || 5.0;
          const isTop = index === 0;
          
          return (
            <button
              key={barber.id}
              onClick={() => onSelect(barber.id)}
              className={`relative overflow-hidden w-full text-left p-5 rounded-3xl transition-all duration-500 flex items-center gap-5 border ${
                isSelected
                  ? `bg-[#0d0d0d] text-white border-[#d4af37]/40 shadow-[0_0_30px_rgba(212,175,55,0.05)]`
                  : 'bg-[#0a0a0a] text-white border-zinc-800/60 shadow-sm hover:border-zinc-700/80 hover:bg-[#111111]'
              }`}
            >
              {/* Subtle Gold Gradient Background inside card when selected */}
              {isSelected && (
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/10 blur-[50px] rounded-full pointer-events-none" />
              )}
              {isSelected && (
                 <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#d4af37]/5 blur-[40px] rounded-full pointer-events-none" />
              )}
              
              {/* Top Badge */}
              {isTop && (
                <div className="absolute top-0 left-6 bg-gradient-to-r from-[#d4af37]/20 to-[#d4af37]/5 text-[#d4af37] px-3 py-1 rounded-b-lg flex items-center gap-1.5 text-[10px] font-bold tracking-widest border border-[#d4af37]/30 border-t-0 shadow-[0_4px_10px_rgba(212,175,55,0.1)] backdrop-blur-sm z-10">
                  <Crown className="w-3 h-3" />
                  TOP
                </div>
              )}

              {/* Avatar Profile */}
              <div className="relative shrink-0 mt-3 md:mt-2">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center overflow-hidden border-2 transition-colors duration-500 ${
                  isSelected ? 'border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'border-zinc-800'
                }`}>
                  {barber.avatar_url ? (
                    <img 
                      src={barber.avatar_url} 
                      alt={barber.name} 
                      className="w-full h-full object-cover aspect-square"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isSelected ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'bg-zinc-800 text-zinc-500'}`}>
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>
                
                {/* Verified Badge */}
                {isSelected && (
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0a0a0a] flex items-center justify-center ${theme.text}`}>
                    <ShieldCheck className="w-5 h-5 drop-shadow-[0_0_5px_currentColor]" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 z-10 pt-2">
                <h3 className="font-extrabold text-lg md:text-xl text-white truncate tracking-wide font-serif">
                  {barber.name.toUpperCase()}
                </h3>
                <p className="text-[11px] md:text-[12px] font-bold mt-1 text-zinc-400 truncate uppercase tracking-widest">
                  {barber.specialty || 'Fade y Barba'}
                </p>
                
                <div className="flex items-center gap-1.5 mt-2.5">
                  <Star className={`w-3.5 h-3.5 fill-[#d4af37] text-[#d4af37]`} />
                  <span className="text-[13px] font-black text-white">{rating.toFixed(1)}</span>
                  <span className="text-[11px] text-zinc-500 font-medium ml-1">(Verificado)</span>
                </div>
              </div>
              
              {/* Custom Radio Circle */}
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-500 z-10 ${
                isSelected ? `${theme.border} bg-transparent shadow-[0_0_8px_currentColor]` : 'border-zinc-700 bg-[#0a0a0a]'
              }`}>
                {isSelected && (
                  <div className={`w-3 h-3 rounded-full ${theme.bg} shadow-[0_0_10px_currentColor] scale-in`} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Floating Action Button area */}
      {selectedBarberId && onContinue && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <button 
            onClick={onContinue}
            className={`w-full relative overflow-hidden group flex items-center justify-center gap-2 text-lg font-bold text-white ${theme.bg} px-5 py-4.5 md:py-5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg`}
          >
             <span className="relative z-10 tracking-wider uppercase font-serif">Continuar</span>
             <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
             
             {/* Glow effect on hover */}
             <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-white/40 blur-sm rounded-full opacity-50" />
          </button>
        </div>
      )}
      
      {/* Footer info */}
      <div className="mt-8 pb-4 flex flex-col items-center justify-center gap-2 text-zinc-500 text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-semibold opacity-60">
         <div className="flex items-center gap-2">
           <ShieldCheck className="w-4 h-4" />
           <span>Tu información está 100% protegida</span>
         </div>
      </div>
      
    </div>
  );
}
