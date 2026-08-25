import type { ThemeClasses } from '../../../shared/utils/theme';

interface Props {
  theme: ThemeClasses;
}

export function Testimonials({ theme }: Props) {
  const testimonials = [
    {
      id: 1,
      name: "Carlos Mendoza",
      text: "El mejor fade que me han hecho en años. El ambiente es increíble y la atención de primera. Totalmente recomendado.",
      rating: 5
    },
    {
      id: 2,
      name: "Andrés Silva",
      text: "Atención rápida y profesional. El sistema de reservas funciona perfecto, llegué y me atendieron a la hora exacta.",
      rating: 5
    },
    {
      id: 3,
      name: "Roberto Campos",
      text: "Excelente servicio de perfilado de barba. Utilizan productos de muy alta calidad y te asesoran en todo momento.",
      rating: 5
    }
  ];

  return (
    <section className="w-full bg-[#0a0a0a] py-20 border-t border-zinc-900/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
            Lo que dicen <br className="md:hidden" />
            <span className={theme.text}>nuestros clientes</span>
          </h3>
          <p className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto">
            La satisfacción de quienes nos visitan es nuestra mejor carta de presentación.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id}
              className="bg-[#111] border border-zinc-800/50 p-8 rounded-[2rem] hover:border-zinc-700 transition-colors relative group"
            >
              {/* Quote Icon Background */}
              <div className="absolute top-6 right-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className={`w-5 h-5 ${theme.text}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-zinc-300 mb-8 leading-relaxed relative z-10 italic">
                "{testimonial.text}"
              </p>

              <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm text-zinc-400">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <h5 className="font-bold text-white text-sm">{testimonial.name}</h5>
                  <p className="text-zinc-500 text-xs">Cliente Frecuente</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
