import type { Appointment, Service } from '../../../types';
import { CheckCircle2, Calendar, Clock, Scissors } from 'lucide-react';
import type { ThemeClasses } from '../../../shared/utils/theme';
import type { Tenant } from '../../../types';

interface Props {
  appointment: Appointment;
  service: Service;
  onReset: () => void;
  theme: ThemeClasses;
  tenant: Tenant | any;
}

export function BookingSuccess({ appointment, service, onReset, theme, tenant }: Props) {

  const generateWhatsAppLink = () => {
    const text = `Hola! He reservado una cita para ${service.name} el día ${appointment.date} a las ${appointment.time}. Mi nombre es ${appointment.client_name}.`;
    const whatsapp = tenant?.whatsapp_number || '1234567890';
    return `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="flex flex-col items-center text-center p-8 bg-[#141414] rounded-3xl border border-zinc-800 shadow-xl w-full mt-4">
      <div className={`w-24 h-24 rounded-full flex items-center justify-center ${theme.bgLight} ${theme.text} mb-6`}>
        <CheckCircle2 className="w-12 h-12" />
      </div>
      <h2 className="text-3xl font-extrabold mb-3 text-white">¡Confirmada!</h2>
      <p className="text-zinc-400 mb-8 text-[15px]">Tu cita ha sido registrada exitosamente. Te esperamos.</p>

      <div className="w-full bg-[#0a0a0a] rounded-2xl p-6 mb-8 space-y-5 text-left border border-zinc-800 shadow-inner">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full ${theme.bgLight} flex items-center justify-center shrink-0`}>
            <Scissors className={`w-6 h-6 ${theme.text}`} />
          </div>
          <span className="font-bold text-[16px] text-white">{service.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full ${theme.bgLight} flex items-center justify-center shrink-0`}>
            <Calendar className={`w-6 h-6 ${theme.text}`} />
          </div>
          <span className="font-semibold text-[15px] text-zinc-300">{appointment.date}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full ${theme.bgLight} flex items-center justify-center shrink-0`}>
            <Clock className={`w-6 h-6 ${theme.text}`} />
          </div>
          <span className="font-semibold text-[15px] text-zinc-300">{appointment.time}</span>
        </div>
      </div>

      <a
        href={generateWhatsAppLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full h-14 bg-[#25D366] text-[#0a0a0a] font-bold text-[16px] rounded-xl hover:bg-[#20bd5a] transition-all active:scale-[0.98] mb-4 flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Avisar por WhatsApp
      </a>
      
      <button
        onClick={onReset}
        className="text-[15px] font-bold text-zinc-500 hover:text-white transition-colors py-2"
      >
        Hacer otra reserva
      </button>
    </div>
  );
}
