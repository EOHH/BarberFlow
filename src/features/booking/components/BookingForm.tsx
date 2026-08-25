import React, { useState } from 'react';
import type { ThemeClasses } from '../../../shared/utils/theme';

interface Props {
  onSubmit: (clientName: string, phone: string) => void;
  isSubmitting: boolean;
  theme: ThemeClasses;
}

const COUNTRIES = [
  { code: '+51', flag: '🇵🇪', name: 'Perú', length: 9, startsWith: '9', placeholder: '987 654 321' },
  { code: '+52', flag: '🇲🇽', name: 'México', length: 10, placeholder: '55 1234 5678' },
  { code: '+54', flag: '🇦🇷', name: 'Argentina', length: 10, placeholder: '11 1234 5678' },
  { code: '+56', flag: '🇨🇱', name: 'Chile', length: 9, placeholder: '9 1234 5678' },
  { code: '+57', flag: '🇨🇴', name: 'Colombia', length: 10, startsWith: '3', placeholder: '312 345 6789' },
  { code: '+58', flag: '🇻🇪', name: 'Venezuela', length: 10, startsWith: '4', placeholder: '414 123 4567' },
  { code: '+591', flag: '🇧🇴', name: 'Bolivia', length: 8, placeholder: '7123 4567' },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador', length: 9, startsWith: '9', placeholder: '99 123 4567' },
  { code: '+595', flag: '🇵🇾', name: 'Paraguay', length: 9, startsWith: '9', placeholder: '981 123 456' },
  { code: '+598', flag: '🇺🇾', name: 'Uruguay', length: 8, startsWith: '9', placeholder: '91 234 567' },
  { code: '+1', flag: '🇺🇸', name: 'USA', length: 10, placeholder: '202 555 0123' },
  { code: '+34', flag: '🇪🇸', name: 'España', length: 9, startsWith: '6', placeholder: '612 345 678' },
];

export function BookingForm({ onSubmit, isSubmitting, theme }: Props) {

  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+51');
  const [error, setError] = useState('');

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    
    if (val.length > 0) {
      if (selectedCountry.startsWith && !val.startsWith(selectedCountry.startsWith)) {
        // Ignorar dígitos iniciales inválidos
        while (val.length > 0 && !val.startsWith(selectedCountry.startsWith)) {
          val = val.substring(1);
        }
      }
      if (val.length > selectedCountry.length) {
        val = val.slice(0, selectedCountry.length);
      }
    }
    
    setPhone(val);
    setError(''); // Limpiar error al tipear
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      setError('Por favor ingresa tu nombre.');
      return;
    }
    const phoneClean = phone.replace(/[^0-9]/g, '');
    
    if (phoneClean.length !== selectedCountry.length) {
      setError(`El número de celular para ${selectedCountry.name} debe tener exactamente ${selectedCountry.length} dígitos.`);
      return;
    }
    
    if (selectedCountry.startsWith && !phoneClean.startsWith(selectedCountry.startsWith)) {
      setError(`Los celulares de ${selectedCountry.name} deben empezar con ${selectedCountry.startsWith}.`);
      return;
    }
    
    setError('');
    onSubmit(clientName.trim(), `${countryCode}${phoneClean}`);
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
        <div className="flex relative shadow-sm">
          <div className="relative shrink-0 z-10">
            <select
              value={countryCode}
              onChange={e => {
                setCountryCode(e.target.value);
                setPhone(''); // Resetear número al cambiar país
                setError('');
              }}
              className={`h-14 pl-4 pr-8 bg-[#0a0a0a] border border-zinc-800 border-r-0 rounded-l-xl focus:outline-none focus:ring-1 ${theme.ring} focus:border-transparent text-white appearance-none cursor-pointer`}
              style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
            >
              {COUNTRIES.map(c => (
                <option key={c.name} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
            <svg className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder={selectedCountry.placeholder}
            className={`w-full pl-4 pr-12 h-14 bg-[#0a0a0a] border border-zinc-800 rounded-r-xl focus:outline-none focus:ring-1 ${theme.ring} focus:border-transparent text-white placeholder-zinc-600 transition-all font-medium tracking-wide`}
            required
          />
          <svg className="w-5 h-5 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
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
