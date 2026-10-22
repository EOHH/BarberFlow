import { useState, useMemo } from 'react';
import type { Service } from '../../../types';
import { Scissors, Clock, Search, X, ArrowRight, ChevronRight } from 'lucide-react';
import type { ThemeClasses } from '../../../shared/utils/theme';

interface Props {
  services: Service[];
  selectedServiceId?: string;
  onSelect: (serviceId: string) => void;
  isLoading: boolean;
  theme: ThemeClasses;
}

export function ServiceSelection({ services, selectedServiceId, onSelect, isLoading, theme }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique categories and calculate counts
  const categoryData = useMemo(() => {
    if (!services || services.length === 0) return [{ name: 'Todos', count: 0 }];
    const counts: Record<string, number> = { Todos: services.length };
    
    services.forEach(s => {
      const rawCat = s.category?.name?.trim();
      const cat = rawCat && rawCat !== '' ? rawCat : 'Otros';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const categoryNames = Object.keys(counts).filter(c => c !== 'Todos').sort();
    return [
      { name: 'Todos', count: services.length },
      ...categoryNames.map(name => ({ name, count: counts[name] }))
    ];
  }, [services]);

  // Filter services by category and search query
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      // Category match
      const catName = s.category?.name?.trim() || 'Otros';
      const matchesCategory = activeCategory === 'Todos' || catName === activeCategory;

      // Search match
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || 
        s.name.toLowerCase().includes(query) || 
        (s.description && s.description.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [services, activeCategory, searchQuery]);

  if (isLoading) {
    return (
      <div className="w-full">
        {/* Skeleton Category Pills */}
        <div className="flex gap-2.5 mb-8 overflow-x-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 w-28 bg-zinc-900/80 border border-zinc-800 animate-pulse rounded-full shrink-0" />
          ))}
        </div>
        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-72 bg-zinc-900/60 border border-zinc-800/80 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-[#121212] border border-zinc-800/80 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4 text-zinc-500">
          <Scissors className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-1">No hay servicios disponibles</h3>
        <p className="text-zinc-500 text-sm max-w-sm">Pronto añadiremos nuevos servicios al catálogo.</p>
      </div>
    );
  }

  return (
    <div id="catalogo" className="flex flex-col w-full">
      
      {/* Desktop Section Header (Hidden on Mobile) */}
      <div className="hidden md:flex items-end justify-between mb-8">
        <div>
          <span className={`text-xs font-bold tracking-[0.25em] ${theme.text} uppercase block mb-1.5`}>
            NUESTROS SERVICIOS
          </span>
          <h2 className="text-3xl lg:text-4xl font-serif font-bold text-white tracking-tight">
            Elige tu estilo
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Servicios profesionales para resaltar tu look y personalidad.
          </p>
        </div>

        <button
          onClick={() => {
            setActiveCategory('Todos');
            setSearchQuery('');
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-zinc-300 bg-zinc-900/80 hover:bg-zinc-800 hover:text-white border border-zinc-800 transition-all cursor-pointer"
        >
          <span>Todos los servicios</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Categories & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        
        {/* Horizontal Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none no-scrollbar">
          {categoryData.map(cat => {
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`group shrink-0 inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-200 active:scale-95 cursor-pointer ${
                  isActive
                    ? `${theme.bg} text-white shadow-md shadow-black/40 border border-transparent`
                    : 'bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full transition-colors ${
                    isActive ? 'bg-black/20 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full md:w-72 shrink-0">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar corte o tratamiento..."
            className="w-full pl-10 pr-9 py-2.5 bg-zinc-900/90 border border-zinc-800/80 text-zinc-200 placeholder-zinc-500 text-xs rounded-full focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-colors shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Services Grid */}
      {filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredServices.map((service) => {
            const isSelected = selectedServiceId === service.id;

            return (
              <div
                key={service.id}
                onClick={() => onSelect(service.id)}
                className={`group relative flex flex-col text-left overflow-hidden rounded-2xl bg-[#121212] border backdrop-blur-sm cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/70 ${
                  isSelected
                    ? `border-2 ${theme.border} ${theme.bgLight} shadow-lg ring-1 ${theme.ring}`
                    : 'border-zinc-800/90 hover:border-zinc-700/90'
                }`}
              >
                {/* Image Container */}
                <div className="relative w-full h-48 sm:h-44 bg-zinc-950 overflow-hidden shrink-0">
                  {service.image_url ? (
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 via-[#161616] to-zinc-950">
                      <Scissors className="w-10 h-10 text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                    </div>
                  )}

                  {/* Gradient mask */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-black/20 pointer-events-none" />

                  {/* Badges Overlay */}
                  <div className="absolute top-3 right-3 pointer-events-none">
                    {/* Duration Badge */}
                    <span className="inline-flex items-center gap-1 bg-black/75 backdrop-blur-md text-zinc-200 font-medium text-[11px] px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {service.duration_minutes} min
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-base text-white tracking-tight group-hover:text-zinc-100 transition-colors line-clamp-1 mb-1">
                    {service.name}
                  </h3>

                  {service.description ? (
                    <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2 mb-4 flex-1">
                      {service.description}
                    </p>
                  ) : (
                    <div className="flex-1 mb-4" />
                  )}

                  {/* Price & Action Row */}
                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between mt-auto">
                    <div>
                      <span className={`text-lg font-black tracking-tight ${theme.text}`}>
                        S/ {Number(service.price).toFixed(2)}
                      </span>
                    </div>

                    {/* Desktop Circle Arrow Button */}
                    <div className="hidden md:flex">
                      <div className={`w-9 h-9 rounded-full bg-zinc-800/90 text-zinc-300 group-hover:${theme.bg} group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm`}>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>

                    {/* Mobile Reservar Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(service.id);
                      }}
                      className={`md:hidden inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shadow-md ${
                        isSelected
                          ? `${theme.bg} text-white shadow-black/40`
                          : `${theme.bg} text-white`
                      }`}
                    >
                      <span>Reservar</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-[#121212] border border-zinc-800/80 rounded-3xl">
          <Search className="w-10 h-10 text-zinc-700 mb-3" />
          <h4 className="text-base font-bold text-zinc-300 mb-1">Sin resultados para "{searchQuery}"</h4>
          <p className="text-zinc-500 text-xs mb-4">Intenta buscar con otra palabra o revisa otra categoría.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('Todos');
            }}
            className="text-xs font-semibold text-zinc-300 hover:text-white underline cursor-pointer"
          >
            Ver todos los servicios
          </button>
        </div>
      )}
    </div>
  );
}
