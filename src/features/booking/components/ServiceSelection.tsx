import { useState, useMemo } from 'react';
import type { Service } from '../../../types';
import { Scissors } from 'lucide-react';
import { usePublicTenant } from '../../../shared/hooks/usePublicTenant';
import { getThemeClasses } from '../../../shared/utils/theme';

interface Props {
  services: Service[];
  selectedServiceId?: string;
  onSelect: (serviceId: string) => void;
  isLoading: boolean;
}

export function ServiceSelection({ services, selectedServiceId, onSelect, isLoading }: Props) {
  const { tenant } = usePublicTenant();
  const theme = getThemeClasses(tenant?.theme_color);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');

  const categories = useMemo(() => {
    if (!services || services.length === 0) return ['Todos'];
    const cats = new Set<string>();
    services.forEach(s => {
      const catName = s.category?.name;
      if (catName && catName.trim() !== '') {
        cats.add(catName.trim());
      } else {
        cats.add('Otros');
      }
    });
    return ['Todos', ...Array.from(cats).sort()];
  }, [services]);

  const filteredServices = useMemo(() => {
    let result = services;
    if (activeCategory !== 'Todos') {
      result = result.filter(s => {
        const catName = s.category?.name;
        const cat = (catName && catName.trim() !== '') ? catName.trim() : 'Otros';
        return cat === activeCategory;
      });
    }
    return result;
  }, [services, activeCategory]);

  if (isLoading) {
    return (
      <div className="w-full">
        {/* Skeletons Búsqueda */}
        <div className="h-12 w-full bg-muted/60 animate-pulse rounded-2xl mb-6"></div>
        {/* Skeletons Pills */}
        <div className="flex gap-2 mb-6 overflow-x-hidden">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-10 w-24 bg-muted/60 animate-pulse rounded-full shrink-0"></div>)}
        </div>
        {/* Skeletons Cards */}
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted/60 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <Scissors className="w-12 h-12 text-muted-foreground/30 mb-4" />
      <h3 className="text-lg font-semibold mb-1">Sin Servicios</h3>
      <p className="text-muted-foreground text-sm">No hay servicios disponibles en este momento.</p>
    </div>;
  }

  return (
    <div className="flex flex-col w-full">
      
      {/* Cabecera (Título y Filtro) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h3 className="text-2xl font-bold text-white">Nuestros Servicios</h3>

        {/* Dropdown Filtro */}
        <div className="relative w-full md:w-[220px]">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>
          </div>
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className={`w-full pl-10 pr-10 py-3 bg-[#141414] border border-zinc-800 text-zinc-200 rounded-xl appearance-none shadow-sm focus:ring-1 focus:${theme.ring} focus:${theme.border} outline-none text-sm cursor-pointer hover:border-zinc-700 transition-colors`}
          >
            {categories.map(category => (
              <option key={category} value={category}>{category === 'Todos' ? 'Ver paquetes' : category}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>

      {/* Lista de Servicios (Grid Responsivo Mockup) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
        {filteredServices.map((service) => (
          <button
            key={service.id}
            onClick={() => onSelect(service.id)}
            className={`group flex flex-row md:flex-col text-left overflow-hidden rounded-2xl transition-all duration-300 active:scale-[0.98] ${
              selectedServiceId === service.id
                ? `border ${theme.border} ${theme.bgLight} shadow-lg shadow-black/40`
                : 'border border-zinc-800 bg-[#141414] hover:border-zinc-700 hover:-translate-y-1'
            }`}
          >
            {/* Desktop: Top Half / Mobile: Left Square */}
            <div className="w-24 md:w-full h-auto md:h-44 bg-zinc-900 relative shrink-0">
              {service.image_url ? (
                <>
                  <img 
                    src={service.image_url} 
                    alt={service.name} 
                    className="w-full h-full object-cover transition-transform duration-700 md:group-hover:scale-105"
                  />
                  {/* Gradiente solo en Desktop */}
                  <div className="hidden md:block absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#141414] to-transparent pointer-events-none" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                  <Scissors className="w-8 h-8 md:w-10 md:h-10 text-zinc-700" />
                  <div className="hidden md:block absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#141414] to-transparent pointer-events-none" />
                </div>
              )}
              
              {/* Etiqueta Popular (Opcional, mock) */}
              <div className="absolute top-3 left-3 bg-emerald-500 text-[#0a0a0a] text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                Popular
              </div>

              {/* Circular Icon Floating (Desktop Only) */}
              <div className="hidden md:flex absolute -bottom-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border border-zinc-700 bg-[#0a0a0a] items-center justify-center z-20">
                 <Scissors className={`w-4 h-4 ${theme.text}`} />
              </div>
            </div>

            {/* Contenido */}
            <div className="p-4 md:px-5 md:pt-8 md:pb-5 flex flex-col flex-1 relative z-10">
              <h3 className="font-bold text-base md:text-lg text-white leading-tight mb-1">{service.name}</h3>
              <p className="text-zinc-400 text-xs md:text-[13px] line-clamp-2 md:line-clamp-3 mb-4 leading-relaxed">
                {service.description || 'Degradado perfecto a navaja con acabado premium.'}
              </p>
              
              <div className="mt-auto flex items-center justify-between w-full pb-3 md:pb-4 border-b border-zinc-800 border-dashed md:border-none">
                <span className="inline-flex items-center gap-1.5 text-zinc-400 text-xs font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {service.duration_minutes} min
                </span>
                <span className={`font-semibold ${theme.text} text-sm tracking-tight`}>S/ {Number(service.price).toFixed(2)}</span>
              </div>
              
              {/* Botón Desktop (Reservar ->) */}
              <div className="hidden md:flex items-center justify-center pt-4 w-full group/btn">
                <span className="text-zinc-300 text-sm font-medium group-hover/btn:text-white transition-colors flex items-center gap-2">
                  Reservar <span className={`${theme.text}`}>→</span>
                </span>
              </div>

              {/* Botón Circular Mobile */}
              <div className="md:hidden absolute right-4 top-1/2 -translate-y-1/2">
                <div className={`w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center transition-colors ${
                  selectedServiceId === service.id ? `${theme.bg} ${theme.border} text-[#0a0a0a]` : 'bg-[#141414] text-zinc-400'
                }`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {filteredServices.length === 0 && (
        <div className="text-center py-12 px-4 border border-zinc-800 border-dashed rounded-3xl mt-4">
          <p className="text-zinc-500 font-medium text-lg">No se encontraron servicios.</p>
        </div>
      )}
    </div>
  );
}
