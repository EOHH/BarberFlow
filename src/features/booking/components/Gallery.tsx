import type { ThemeClasses } from '../../../shared/utils/theme';
import type { GalleryImage } from '../../../types';

interface Props {
  theme: ThemeClasses;
  images: GalleryImage[];
  onViewAll: () => void;
}

export function Gallery({ theme, images, onViewAll }: Props) {
  // Solo mostramos las primeras 4
  const displayImages = images.slice(0, 4);

  if (displayImages.length === 0) return null;

  return (
    <section className="w-full bg-[#050505] py-20 border-t border-zinc-900/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
          <div className="text-left">
            <div className={`inline-flex items-center gap-2 mb-4 text-[10px] font-bold tracking-[0.2em] ${theme.text} uppercase`}>
              — NUESTRO ARTE
            </div>
            <h3 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Inspiración para tu <br />
              <span className={theme.text}>próximo corte</span>
            </h3>
          </div>
          <button onClick={onViewAll} className="hidden md:flex items-center gap-2 text-white bg-[#111] hover:bg-zinc-800 border border-zinc-800 px-6 py-3 rounded-full text-sm font-semibold transition-colors">
            Ver todas las fotos
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {displayImages.map((img) => (
            <div 
              key={img.id} 
              className="relative rounded-3xl overflow-hidden group"
            >
              <div className="relative aspect-[4/5] w-full bg-zinc-900 overflow-hidden">
                <img 
                  src={img.image_url} 
                  alt={img.caption || "Galería"} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div className={`w-8 h-8 rounded-full ${theme.bg} flex items-center justify-center text-white`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center md:hidden">
          <button onClick={onViewAll} className="flex items-center gap-2 text-white bg-[#111] hover:bg-zinc-800 border border-zinc-800 px-8 py-4 rounded-full text-sm font-semibold transition-colors">
            Ver todas las fotos
          </button>
        </div>
      </div>
    </section>
  );
}
