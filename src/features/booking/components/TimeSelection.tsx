import type { ThemeClasses } from '../../../shared/utils/theme';
import type { TimeSlot } from '../../../types';
import { Sun, Sunset, Moon, Clock } from 'lucide-react';

interface Props {
  timeSlots: TimeSlot[];
  selectedTime?: string;
  onSelect: (time: string) => void;
  isLoading: boolean;
  theme: ThemeClasses;
}

export function TimeSelection({ timeSlots, selectedTime, onSelect, isLoading, theme }: Props) {

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-12 bg-muted rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <div className="p-8 text-center bg-muted/30 rounded-xl border border-dashed flex flex-col items-center gap-3">
        <Clock className="w-8 h-8 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No hay turnos disponibles ni ocupados para este día.</p>
      </div>
    );
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  // Group slots by time of day
  const groupedSlots = timeSlots.reduce((acc, slot) => {
    const hour = parseInt(slot.time.split(':')[0]);
    if (hour < 12) acc.morning.push(slot);
    else if (hour < 18) acc.afternoon.push(slot);
    else acc.evening.push(slot);
    return acc;
  }, { morning: [] as TimeSlot[], afternoon: [] as TimeSlot[], evening: [] as TimeSlot[] });

  const renderGroup = (title: string, icon: React.ReactNode, slots: TimeSlot[]) => {
    if (slots.length === 0) return null;
    
    return (
      <div className="mb-8 last:mb-0">
        <div className="flex items-center gap-2 mb-4 text-zinc-400">
          {icon}
          <h3 className="font-bold text-sm tracking-widest uppercase">{title}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {slots.map(slot => {
            const isSelected = selectedTime === slot.time;
            const isAvailable = slot.available;
            
            return (
              <button
                key={slot.time}
                disabled={!isAvailable}
                onClick={() => onSelect(slot.time)}
                className={`py-3 px-2 rounded-xl text-sm font-bold transition-all border flex flex-col items-center justify-center gap-1 ${
                  isAvailable 
                    ? isSelected
                      ? `bg-[#141414] ${theme.border} ${theme.text} shadow-lg shadow-black/40 scale-[0.98]`
                      : 'bg-[#141414] text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white active:scale-[0.98]'
                    : 'bg-transparent text-zinc-600 border-zinc-900/50 cursor-not-allowed grayscale'
                }`}
              >
                <span>{formatTime(slot.time)}</span>
                {!isAvailable && (
                  <span className="text-[9px] uppercase tracking-wider font-semibold opacity-70">
                    {slot.reason === 'past' ? 'Ya pasó' : 'Ocupado'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderGroup('Mañana', <Sun className="w-4 h-4" />, groupedSlots.morning)}
      {renderGroup('Tarde', <Sunset className="w-4 h-4" />, groupedSlots.afternoon)}
      {renderGroup('Noche', <Moon className="w-4 h-4" />, groupedSlots.evening)}
    </div>
  );
}
