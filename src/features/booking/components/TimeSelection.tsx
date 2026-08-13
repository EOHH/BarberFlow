import { usePublicTenant } from '../../../shared/hooks/usePublicTenant';
import { getThemeClasses } from '../../../shared/utils/theme';

interface Props {
  timeSlots: string[];
  selectedTime?: string;
  onSelect: (time: string) => void;
  isLoading: boolean;
}

export function TimeSelection({ timeSlots, selectedTime, onSelect, isLoading }: Props) {
  const { tenant } = usePublicTenant();
  const theme = getThemeClasses(tenant?.theme_color);

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
      <div className="p-8 text-center bg-muted/30 rounded-xl border border-dashed">
        <p className="text-muted-foreground">No hay horarios disponibles para este día.</p>
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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {timeSlots.map(time => {
        const isSelected = selectedTime === time;
        return (
          <button
            key={time}
            onClick={() => onSelect(time)}
            className={`py-4 px-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98] border ${
              isSelected
                ? `bg-[#141414] ${theme.border} ${theme.text} shadow-lg shadow-black/40`
                : 'bg-[#141414] text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
            }`}
          >
            {formatTime(time)}
          </button>
        );
      })}
    </div>
  );
}
