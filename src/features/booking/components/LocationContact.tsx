import type { ThemeClasses } from '../../../shared/utils/theme';
import type { Tenant } from '../../../types';
import { Calendar, MapPin, Clock, Navigation, Scissors } from 'lucide-react';

interface Props {
  theme: ThemeClasses;
  tenant: Tenant;
  onBookClick?: () => void;
}

export function LocationContact({ theme, tenant, onBookClick }: Props) {
  const directionsUrl = tenant.google_maps_url || 
    (tenant.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tenant.address)}` : undefined);

  const mapAddress = tenant.address || 'Peru';
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  const hasLocationDetails = Boolean(tenant.address || tenant.business_hours);

  return (
    <section id="ubicacion" className="w-full bg-[#0a0a0a] py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="bg-[#121212] border border-zinc-800/80 rounded-3xl overflow-hidden flex flex-col lg:flex-row shadow-2xl">
          
          {/* Info Side */}
          <div className="p-8 sm:p-10 lg:p-14 flex-1 flex flex-col justify-between">
            <div>
              {/* Tag & Title */}
              <span className={`text-[11px] font-bold tracking-[0.25em] ${theme.text} uppercase block mb-2`}>
                VISÍTANOS
              </span>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-tight mb-8">
                Vive la <br />
                <span className={theme.text}>Experiencia</span>
              </h3>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 mb-10">
                {onBookClick && (
                  <button
                    onClick={onBookClick}
                    className={`inline-flex items-center gap-2 ${theme.bg} ${theme.bgHover} text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-95 cursor-pointer`}
                  >
                    <Calendar className="w-4 h-4 text-white" />
                    <span>Reservar Cita</span>
                  </button>
                )}
                
                {directionsUrl && (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-white font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl transition-all hover:border-zinc-500 cursor-pointer"
                  >
                    <Navigation className="w-4 h-4 text-zinc-400" />
                    <span>Cómo llegar</span>
                  </a>
                )}
              </div>

              {/* Details List (Only rendered if real data exists) */}
              {hasLocationDetails && (
                <div className="space-y-6 pt-4 border-t border-zinc-800/70">
                  {/* Location */}
                  {tenant.address && (
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900/80 flex items-center justify-center shrink-0 ${theme.text}`}>
                        <Scissors className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-1">Ubicación</h4>
                        <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                          {tenant.address}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Hours */}
                  {tenant.business_hours && (
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900/80 flex items-center justify-center shrink-0 ${theme.text}`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-1">Horarios de Atención</h4>
                        <div className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                          {tenant.business_hours.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Map Side */}
          <div className="flex-1 min-h-[320px] lg:min-h-[460px] bg-zinc-950 relative overflow-hidden flex items-center justify-center">
            {/* Embedded Dark Grayscale Map */}
            <iframe 
              src={mapEmbedUrl}
              title="Ubicación Barbería"
              className="absolute inset-0 w-full h-full border-0 opacity-40 grayscale invert pointer-events-none" 
              allowFullScreen={false} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            />
            
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-[#121212]/40 pointer-events-none" />

            {/* Custom Location Badge (Uses dynamic tenant theme classes) */}
            <div className="relative z-10 max-w-[280px] sm:max-w-xs bg-zinc-950/90 border border-zinc-800 backdrop-blur-md rounded-2xl p-4 shadow-2xl flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${theme.bgLight} border ${theme.border} flex items-center justify-center shrink-0`}>
                <MapPin className={`w-5 h-5 ${theme.text}`} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-white text-xs tracking-wider uppercase truncate">
                  {tenant.name || 'Barbería'}
                </span>
                {tenant.address && (
                  <span className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {tenant.address}
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
