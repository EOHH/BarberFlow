import type { ThemeClasses } from '../../shared/utils/theme';
import type { GalleryImage } from '../../types';
import { motion } from 'framer-motion';
import { Scissors, Calendar } from 'lucide-react';

interface Props {
  theme: ThemeClasses;
  images: GalleryImage[];
  slug?: string;
  onBookClick: () => void;
}

export function PublicGalleryTab({ theme, images, onBookClick }: Props) {
  return (
    <div className="w-full bg-[#050505] flex flex-col relative pb-32">
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center">
        
        {/* Header Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 flex flex-col items-center"
        >
          <div className={`inline-flex items-center gap-2 mb-4 text-[10px] font-bold tracking-[0.3em] ${theme.text} uppercase`}>
            PORTAFOLIO
          </div>
          <h1 className="text-5xl md:text-7xl font-light mb-6 tracking-tight text-white font-serif">
            Nuestra <span className={`${theme.text} font-medium`}>Galería</span>
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-lg mx-auto font-medium leading-relaxed">
            Cada imagen refleja nuestra pasión por el detalle,<br className="hidden md:block"/> 
            la dedicación y el arte de realzar tu estilo.
          </p>
        </motion.div>

        {/* Masonry / Grid of Images */}
        {images.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[250px]"
          >
            {images.map((img, index) => {
              // Creating a varied grid layout based on index
              const isLarge = index % 5 === 0;
              const isWide = index % 5 === 1;
              const isTall = index % 5 === 2;

              let spanClass = "col-span-1 row-span-1";
              if (isLarge) spanClass = "col-span-1 md:col-span-2 row-span-2";
              else if (isWide) spanClass = "col-span-1 md:col-span-2 row-span-1";
              else if (isTall) spanClass = "col-span-1 row-span-2";

              return (
                <div 
                  key={img.id} 
                  className={`relative rounded-2xl overflow-hidden group border border-zinc-800 hover:border-zinc-600 transition-colors ${spanClass}`}
                >
                  <img 
                    src={img.image_url} 
                    alt={img.caption || "Galería"} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-70 group-hover:opacity-100"
                  />
                  {/* Subtle overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    {img.caption && (
                      <p className="text-white font-medium text-sm drop-shadow-md">
                        {img.caption}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <div className="w-full py-20 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-3xl">
            <p>No hay imágenes en la galería aún.</p>
          </div>
        )}

      </main>

      {/* Floating Bottom CTA */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-2xl bg-[#0d0d0d]/90 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-black/50"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
            <Scissors className={`w-4 h-4 ${theme.text}`} />
          </div>
          <div className="text-center md:text-left">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-0.5">¿LISTO PARA TU MEJOR VERSIÓN?</h4>
            <p className="text-[10px] sm:text-xs text-zinc-400">Reserva tu cita y déjanos realzar tu estilo.</p>
          </div>
        </div>
        <button 
          onClick={onBookClick}
          className={`shrink-0 px-6 py-3 ${theme.bg} ${theme.bgHover} text-[#050505] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors`}
        >
          RESERVAR CITA
          <Calendar className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
