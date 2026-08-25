import { useParams, Link } from 'react-router-dom';
import { usePublicTenant } from '../../shared/hooks/usePublicTenant';
import { usePublicGallery } from '../../shared/hooks/usePublicGallery';
import { ChevronLeft, Loader2, Image as ImageIcon } from 'lucide-react';
import { getThemeClasses } from '../../shared/utils/theme';
import { usePublicRealtime } from '../../shared/hooks/usePublicRealtime';

export function PublicGalleryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { tenantData, isLoading: isLoadingTenant } = usePublicTenant(slug);
  
  const tenant = tenantData?.tenant || { name: slug || 'BarberShop', theme_color: '#000000' };
  const theme = getThemeClasses(tenant?.theme_color);

  // Setup Realtime subscriptions
  usePublicRealtime(tenant?.id, slug);

  const { galleryImages, isLoading: isLoadingGallery } = usePublicGallery(slug);

  if (isLoadingTenant || isLoadingGallery) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className={`w-12 h-12 animate-spin ${theme.text}`} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link 
            to={`/booking/${slug}`}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Volver a inicio</span>
          </Link>
          <div className="font-black text-xl tracking-tight uppercase">
            {tenant.name}
          </div>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className={`inline-flex items-center gap-2 mb-4 text-[10px] font-bold tracking-[0.2em] ${theme.text} uppercase`}>
            — PORTAFOLIO
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            Nuestra <span className={theme.text}>Galería</span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Explora nuestros mejores trabajos y encuentra la inspiración para tu próximo corte. Cada imagen representa la dedicación y el arte de nuestros barberos.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          {galleryImages.length === 0 ? (
            <div className="text-center py-20 border border-zinc-900 rounded-3xl bg-[#0a0a0a]">
              <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Galería en construcción</h3>
              <p className="text-zinc-500">Pronto subiremos nuestras mejores fotos aquí.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {galleryImages.map((img) => (
                <div key={img.id} className="relative group rounded-2xl overflow-hidden bg-zinc-900">
                  <div className="relative aspect-[4/5] w-full bg-zinc-900 overflow-hidden">
                    <img 
                      src={img.image_url} 
                      alt={img.caption || "Galería del barbero"} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <div className={`w-10 h-10 rounded-full ${theme.bg} flex items-center justify-center text-white mb-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-300`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </div>
                    {img.caption && (
                      <p className="text-white text-sm font-medium line-clamp-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                        {img.caption}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
