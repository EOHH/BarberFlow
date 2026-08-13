import React, { useState } from 'react';
import { usePublicTenant } from '../../../shared/hooks/usePublicTenant';
import { getThemeClasses } from '../../../shared/utils/theme';

interface Props {
  onSubmit: (clientName: string, phone: string) => void;
  isSubmitting: boolean;
}

export function BookingForm({ onSubmit, isSubmitting }: Props) {
  const { tenant } = usePublicTenant();
  const theme = getThemeClasses(tenant?.theme_color);

  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setError('Por favor ingresa tu nombre.');
      return;
    }
    const phoneClean = phone.replace(/[^0-9+]/g, '');
    if (phoneClean.length < 8) {
      setError('Por favor ingresa un número de teléfono válido.');
      return;
    }
    
    setError('');
    onSubmit(clientName.trim(), phoneClean);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-[#141414] p-6 md:p-8 rounded-3xl border border-zinc-800 shadow-xl">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-semibold text-white">Nombre Completo</label>
        <input
          id="name"
          type="text"
          value={clientName}
          onChange={e => setClientName(e.target.value)}
          placeholder="Ej. Juan Pérez"
          className={`w-full px-5 h-14 bg-[#0a0a0a] border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 ${theme.ring} focus:border-transparent text-white placeholder-zinc-600 transition-all`}
          required
        />
      </div>
      <div className="space-y-2 relative">
        <label htmlFor="phone" className="block text-sm font-semibold text-white">Teléfono (WhatsApp)</label>
        <div className="relative">
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+51 987 654 321"
            className={`w-full px-5 h-14 bg-[#0a0a0a] border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 ${theme.ring} focus:border-transparent text-white placeholder-zinc-600 transition-all`}
            required
          />
          <svg className="w-5 h-5 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-[#0a0a0a] border border-zinc-800/80 rounded-xl mt-6">
        <svg className={`w-5 h-5 ${theme.text} shrink-0 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
        <div>
          <p className="text-sm font-bold text-white mb-0.5">Tu información está segura</p>
          <p className="text-xs text-zinc-500">Solo la usaremos para confirmar tu cita.</p>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm font-medium text-center bg-red-400/10 p-3 rounded-xl border border-red-400/20">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full h-14 mt-6 ${theme.bg} text-[#0a0a0a] font-bold text-lg rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-black/40`}
      >
        {isSubmitting ? 'Confirmando...' : 'Reservar Ahora'}
        {!isSubmitting && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
      </button>
    </form>
  );
}
