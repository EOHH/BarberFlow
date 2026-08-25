import type { ThemeClasses } from '../../../shared/utils/theme';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, ArrowRight } from 'lucide-react';
import { useRef, useState } from 'react';

const TIME_ZONE = 'America/Lima';

interface Props {
  selectedDate: string;
  onSelect: (date: string) => void;
  onContinue?: () => void;
  theme: ThemeClasses;
}

export function DateSelection({ selectedDate, onSelect, onContinue, theme }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  // Generate next 14 days strictly in America/Lima time
  const days = Array.from({ length: 14 }).map((_, i) => {
    const nowZoned = toZonedTime(new Date(), TIME_ZONE);
    const targetDate = addDays(nowZoned, i);
    return formatInTimeZone(targetDate, TIME_ZONE, 'yyyy-MM-dd');
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00'); // Use noon to avoid timezone shift
    return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll <= 0) return;
      
      const scrollPercentage = scrollLeft / maxScroll;
      // Map percentage to 4 dots (index 0 to 3)
      // Usamos Math.round para que cambie a la mitad del trayecto
      const dotIndex = Math.min(3, Math.max(0, Math.round(scrollPercentage * 3)));
      setActiveIndex(dotIndex);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftPos(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-fast
    scrollRef.current.scrollLeft = scrollLeftPos - walk;
  };

  // Determine current month from first day
  const firstDayObj = new Date(days[0] + 'T12:00:00');
  const monthYearStr = format(firstDayObj, 'MMMM yyyy', { locale: es }).toUpperCase();

  return (
    <div className="w-full flex flex-col h-full relative">
      
      {/* Calendar Card Container */}
      <div className="bg-[#0a0a0a] rounded-[2rem] p-5 md:p-7 border border-zinc-800/50 shadow-xl relative overflow-hidden">
        
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-white/5 blur-[60px] pointer-events-none" />

        {/* Header (Month Navigation) */}
        <div className="flex items-center justify-between mb-8 relative z-10">
          <button onClick={() => scroll('left')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className={`${theme.text} font-bold tracking-[0.25em] text-[11px] md:text-xs drop-shadow-[0_0_8px_currentColor]`}>
            {monthYearStr}
          </span>
          <button onClick={() => scroll('right')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Days Container */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2 relative z-10 ${isDragging ? 'cursor-grabbing snap-none' : 'cursor-grab snap-x'}`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
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
                className={`relative shrink-0 snap-center flex flex-col items-center justify-center py-6 px-4 rounded-3xl min-w-[90px] md:min-w-[100px] border transition-all duration-500 hover:-translate-y-1 select-none ${
                  isSelected
                    ? `bg-[#0d0d0d] ${theme.border} ${theme.text} shadow-[0_0_20px_rgba(255,255,255,0.05)]`
                    : 'bg-[#0f0f0f] text-white border-zinc-800/60 shadow-sm hover:border-zinc-700 hover:bg-[#141414]'
                }`}
              >
                {/* Glow Dot for Selected */}
                {isSelected && (
                  <div className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full ${theme.bg} shadow-[0_0_8px_currentColor]`} />
                )}

                <span className={`text-[10px] md:text-[11px] font-bold tracking-[0.2em] ${isSelected ? theme.text : 'text-zinc-500'} mb-3 transition-colors`}>
                  {dayName}
                </span>
                <span className="text-3xl md:text-4xl font-extrabold mb-2 font-serif tracking-tight">
                  {dayNum}
                </span>
                <span className={`text-[9px] md:text-[10px] font-bold tracking-[0.2em] ${isSelected ? theme.text : 'text-zinc-600'} transition-colors`}>
                  {monthName}
                </span>

                {/* Ambient Selection Glow inside card */}
                {isSelected && (
                  <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white/5 blur-xl rounded-b-3xl pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-1.5 mt-6">
          {[0, 1, 2, 3].map(index => (
            <div 
              key={index} 
              className={`h-1 rounded-full transition-all duration-500 ${
                activeIndex === index 
                  ? `w-8 ${theme.bg} shadow-[0_0_8px_currentColor]` 
                  : 'w-4 bg-zinc-800/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Selected Date Summary Pill */}
      {selectedDate && (
        <div className="mt-6 flex items-center justify-between p-4 md:p-5 bg-[#0a0a0a] border border-zinc-800/50 rounded-[1.5rem] group hover:border-zinc-700/80 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-lg cursor-default">
           <div className="flex items-center gap-4">
             <div className="relative">
               <div className={`absolute inset-0 ${theme.bg} blur-md opacity-20 rounded-full`} />
               <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-[#111111] border border-zinc-800/80 ${theme.text} relative z-10`}>
                 <Calendar className="w-5 h-5" />
               </div>
             </div>
             <div>
                <p className="text-zinc-400 text-xs md:text-sm font-medium mb-0.5">Horarios disponibles para el</p>
                <p className={`font-bold ${theme.text} text-sm md:text-base lowercase tracking-wide drop-shadow-[0_0_5px_currentColor]`}>
                  {formatDate(selectedDate)}.
                </p>
             </div>
           </div>
           <ChevronRight className="w-5 h-5 text-zinc-600" />
        </div>
      )}

      {/* Floating Action Button */}
      {selectedDate && onContinue && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <button 
            onClick={onContinue}
            className={`w-full relative overflow-hidden group flex items-center justify-center gap-2 text-lg font-bold text-white ${theme.bg} px-5 py-4.5 md:py-5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg`}
          >
             <span className="relative z-10 tracking-wider uppercase font-serif">Continuar</span>
             <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
             
             {/* Glow effect on hover */}
             <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-white/40 blur-sm rounded-full opacity-50" />
          </button>
        </div>
      )}

    </div>
  );
}
