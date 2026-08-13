import type { ThemeClasses } from '../../../shared/utils/theme';

interface Props {
  selectedDate: string;
  onSelect: (date: string) => void;
  theme: ThemeClasses;
}

export function DateSelection({ selectedDate, onSelect, theme }: Props) {
  // Generate next 14 days
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00'); // Use noon to avoid timezone shift
    return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
  };

  return (
    <div className="w-full">
      <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar -mx-4 px-4 snap-x">
        {days.map(date => {
          const isSelected = selectedDate === date;
          const dateObj = new Date(date + 'T12:00:00');
          const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(dateObj).toUpperCase();
          const dayNum = dateObj.getDate();
          const monthName = new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(dateObj).toUpperCase();

          return (
            <button
              key={date}
              onClick={() => onSelect(date)}
              className={`snap-center flex flex-col items-center justify-center p-5 rounded-2xl min-w-[100px] border-2 transition-all active:scale-[0.98] ${
                isSelected
                  ? `bg-[#141414] ${theme.border} ${theme.text} shadow-lg shadow-black/40`
                  : 'bg-[#141414] text-white border-zinc-800 shadow-sm hover:border-zinc-600'
              }`}
            >
              <span className={`text-[11px] font-bold tracking-widest ${isSelected ? theme.text : 'text-zinc-500'} mb-2`}>
                {dayName},
              </span>
              <span className="text-3xl font-black mb-1">
                {dayNum}
              </span>
              <span className={`text-[10px] font-bold tracking-widest ${isSelected ? theme.text : 'text-zinc-500'}`}>
                {monthName}
              </span>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-4 flex items-center gap-3 p-4 bg-[#141414] border border-zinc-800 rounded-xl">
          <svg className={`w-5 h-5 ${theme.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <p className="text-zinc-400 text-sm">
            Horarios disponibles para el <span className="font-bold text-white">{formatDate(selectedDate)}</span>.
          </p>
        </div>
      )}
    </div>
  );
}
