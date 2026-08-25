import type { Barber } from '../../../types';
import type { ThemeClasses } from '../../../shared/utils/theme';

interface Props {
  barbers: Barber[];
  theme: ThemeClasses;
}

export function LiveBarberStatus({ barbers, theme }: Props) {
  if (!barbers || barbers.length === 0) return null;

  return (
    <section className="w-full bg-[#050505] py-16 md:py-24 border-t border-zinc-900/50 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-white/5 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-5xl font-black text-white font-serif tracking-tight mb-4">
            Nuestro <span className={theme.text}>Equipo</span>
          </h3>
          <p className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto">
            Conoce a nuestros maestros barberos y revisa su disponibilidad en tiempo real para tu próxima cita.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbers.map((barber) => {
            // TODO: En el futuro esto vendrá de un RPC que cruza con appointments
            const isAvailable = true; // Por ahora mostramos disponible como demo

            return (
              <div 
                key={barber.id} 
                className="bg-[#0a0a0a] border border-zinc-800/60 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 hover:border-zinc-700/80 transition-colors group"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={`absolute inset-0 ${theme.bg} blur-xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity`} />
                  {barber.avatar_url ? (
                    <img 
                      src={barber.avatar_url} 
                      alt={barber.name} 
                      className="w-24 h-24 rounded-full object-cover border-2 border-zinc-800 relative z-10"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center relative z-10">
                      <span className="text-2xl text-zinc-500 font-bold font-serif">{barber.name.charAt(0)}</span>
                    </div>
                  )}
                  
                  {/* Status Indicator Dot */}
                  <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#0a0a0a] flex items-center justify-center z-20">
                    {isAvailable ? (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                    ) : (
                      <span className="relative flex h-3 w-3">
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <h4 className="text-xl font-bold text-white mb-1">{barber.name}</h4>
                  
                  {/* Status Pill */}
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
                    isAvailable 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {isAvailable ? 'Disponible Ahora' : 'Ocupado'}
                  </div>

                  <p className="text-zinc-500 text-sm line-clamp-2">
                    Especialista en cortes modernos y perfilado clásico.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
