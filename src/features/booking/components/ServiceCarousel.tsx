import type { Service } from '../../../types';
import type { ThemeClasses } from '../../../shared/utils/theme';
import { Scissors } from 'lucide-react';

interface Props {
  services: Service[];
  theme: ThemeClasses;
  onViewAll: () => void;
  onSelectService: (id: string) => void;
}

export function ServiceCarousel({ services, theme, onViewAll, onSelectService }: Props) {
  if (!services || services.length === 0) return null;

  // Tomamos los primeros 5-6 servicios para mostrar en el carrusel
  const displayServices = services.slice(0, 6);
  // Duplicamos para efecto marquee infinito suave
  const marqueeItems = [...displayServices, ...displayServices];

  return (
    <section className="w-full bg-[#050505] py-16 md:py-20 border-y border-zinc-900/50 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-8 flex items-end justify-between">
        <div>
          <div className={`inline-flex items-center gap-2 mb-3 text-[10px] font-bold tracking-[0.2em] ${theme.text} uppercase`}>
            — EXPERIENCIA PREMIUM
          </div>
          <h3 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Nuestros <span className={theme.text}>Servicios</span>
          </h3>
        </div>
        <button 
          onClick={onViewAll}
          className="hidden md:flex items-center gap-2 text-white bg-[#111] hover:bg-zinc-800 border border-zinc-800 px-6 py-3 rounded-full text-sm font-semibold transition-colors"
        >
          Ver Todo el Catálogo
        </button>
      </div>

      {/* Marquee Container */}
      <div className="relative w-full flex overflow-x-hidden group">
        {/* Left Fade */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
        
        <div className="flex gap-6 animate-marquee hover:[animation-play-state:paused] px-6 md:px-12 py-4">
          {marqueeItems.map((service, idx) => (
            <div 
              key={`${service.id}-${idx}`}
              onClick={() => onSelectService(service.id)}
              className="w-[280px] md:w-[320px] shrink-0 bg-[#0a0a0a] border border-zinc-800/60 rounded-3xl overflow-hidden hover:border-zinc-700/80 hover:bg-[#111] transition-all cursor-pointer group/card flex flex-col"
            >
              {/* Image Section */}
              <div className="w-full h-40 bg-zinc-900 relative overflow-hidden">
                {service.image_url ? (
                  <img src={service.image_url} alt={service.name} className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover/card:opacity-40 transition-opacity">
                    <Scissors className={`w-16 h-16 ${theme.text}`} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent opacity-90" />
                
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                  <span className="text-white font-bold text-sm block">${Number(service.price).toFixed(2)}</span>
                </div>
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-2 py-1.5 rounded-full border border-white/10 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-zinc-300 text-xs font-semibold">{service.duration_minutes}m</span>
                </div>
              </div>
              
              <div className="p-6 pt-4 flex-1 flex flex-col">
                <h4 className="text-lg font-bold text-white mb-2 group-hover/card:text-[var(--theme-color)] transition-colors line-clamp-1" style={{ '--theme-color': theme.bg.replace('bg-', '') } as any}>
                  {service.name}
                </h4>
                <p className="text-zinc-400 text-sm line-clamp-2 flex-1">
                  {service.description || 'Experimenta un servicio de primera calidad diseñado para tu estilo.'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Right Fade */}
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />
      </div>

      <div className="mt-8 flex justify-center md:hidden">
        <button 
          onClick={onViewAll}
          className={`text-[#0a0a0a] ${theme.bg} px-8 py-4 rounded-xl text-sm font-bold ${theme.bgHover} transition-colors`}
        >
          Ver Todos los Servicios
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 12px)); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}} />
    </section>
  );
}
