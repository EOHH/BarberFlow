import type { ThemeClasses } from '../../../shared/utils/theme';

import type { Tenant } from '../../../types';

interface Props {
  theme: ThemeClasses;
  tenant: Tenant;
}

export function LocationContact({ theme, tenant }: Props) {
  
  // Format business hours string to handle newlines from textarea
  const renderBusinessHours = () => {
    if (!tenant.business_hours) {
      return <p className="text-zinc-400 text-sm">Lunes a Sábado: 10:00 AM - 9:00 PM<br/>Domingos: 10:00 AM - 3:00 PM</p>;
    }
    
    return (
      <div className="text-zinc-400 text-sm">
        {tenant.business_hours.split('\n').map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    );
  };
  
  const whatsappUrl = tenant.whatsapp_number 
    ? `https://wa.me/${tenant.whatsapp_number.replace(/[^0-9]/g, '')}` 
    : '#';

  const directionsUrl = tenant.google_maps_url || '#';
  
  // Use a default address if none is provided to avoid broken map
  const mapAddress = tenant.address || 'Lima, Peru';
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  return (
    <section className="w-full bg-[#0a0a0a] py-20 border-t border-zinc-900/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="bg-[#111] border border-zinc-800 rounded-[2rem] overflow-hidden flex flex-col lg:flex-row">
          
          {/* Info Side */}
          <div className="p-10 md:p-16 flex-1 flex flex-col justify-center">
            <h3 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-8">
              Ven a vivir la <br />
              <span className={theme.text}>Experiencia</span>
            </h3>
            
            <div className="space-y-6 mb-10">
              <div className="flex gap-4 items-start">
                <div className={`w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 ${theme.text}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Ubicación</h4>
                  <p className="text-zinc-400 text-sm">
                    {tenant.address ? tenant.address : (
                      <>Av. Principal 123, Distrito Central.<br/>Frente al parque principal.</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className={`w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 ${theme.text}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">Horario de Atención</h4>
                  {renderBusinessHours()}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center justify-center gap-2 text-[#0a0a0a] ${theme.bg} px-6 py-3.5 rounded-xl font-bold ${theme.bgHover} transition-colors`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                WhatsApp
              </a>
              <a 
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-6 py-3.5 rounded-xl font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                Cómo Llegar
              </a>
            </div>
          </div>

          {/* Map Side */}
          <div className="flex-1 min-h-[300px] bg-zinc-900 relative">
            {/* Embedded Google Maps dynamically generated from address */}
            <iframe 
              src={mapEmbedUrl}
              className="absolute inset-0 w-full h-full border-0 opacity-60 grayscale invert" 
              allowFullScreen={false} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
            <div className="absolute inset-0 bg-[#111]/30 pointer-events-none mix-blend-multiply"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
