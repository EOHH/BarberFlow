import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAvailabilityAdmin } from '../../shared/hooks/useAvailabilityAdmin';
import { useStaffAdmin } from '../../shared/hooks/useStaffAdmin';
import { ArrowLeft, Clock, Save, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import type { Availability } from '../../types';
import { useTenantSettings } from '../../shared/hooks/useTenantSettings';
import { getThemeClasses } from '../../shared/utils/theme';

const DAYS_MAP = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function AvailabilityManagerPage() {
  const { tenant } = useTenantSettings();
  const themeClasses = getThemeClasses(tenant?.theme_color);
  const { barberId } = useParams<{ barberId: string }>();
  const navigate = useNavigate();
  
  const { barbers } = useStaffAdmin();
  const barber = barbers.find(b => b.id === barberId);

  const { availabilities, isLoading, saveAvailability } = useAvailabilityAdmin(barberId);
  
  const [schedule, setSchedule] = useState<Partial<Availability>[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (availabilities.length > 0) {
      // Ensure all 7 days exist in state, sort from Monday(1) to Sunday(0)
      const sorted = [...availabilities].sort((a, b) => {
        const da = a.day_of_week === 0 ? 7 : (a.day_of_week ?? 7);
        const db = b.day_of_week === 0 ? 7 : (b.day_of_week ?? 7);
        return da - db;
      });
      setSchedule(sorted);
    }
  }, [availabilities]);

  const handleToggleDay = (dayIndex: number) => {
    setSchedule(prev => prev.map(day => 
      day.day_of_week === dayIndex ? { ...day, is_active: !day.is_active } : day
    ));
  };

  const handleTimeChange = (dayIndex: number, field: 'start_time' | 'end_time', value: string) => {
    setSchedule(prev => prev.map(day => 
      day.day_of_week === dayIndex ? { ...day, [field]: value + ':00' } : day
    ));
  };

  const formatTimeForInput = (timeString: string) => {
    if (!timeString) return '09:00';
    return timeString.substring(0, 5);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveAvailability(schedule);
      toast.success('Horario guardado exitosamente');
      navigate('/admin/staff');
    } catch (err: any) {
      toast.error('Error al guardar el horario: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !barber) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 dark:text-zinc-400 animate-pulse">
        <Loader2 className={`w-8 h-8 animate-spin ${themeClasses.text} mb-4`} />
        <p className="font-medium">Cargando configuración de horarios...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#141414] p-6 rounded-[24px] border border-slate-200 dark:border-zinc-800/50 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/staff')}
            className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Horario de {barber.name}</h1>
            <p className="text-[14px] text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5 font-medium">
              <Calendar className="w-4 h-4" /> Configura los días y horas laborales
            </p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center justify-center gap-2 ${themeClasses.bg} text-white px-6 h-12 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-md w-full sm:w-auto hover:brightness-110`}
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar Cambios
        </button>
      </div>

      {/* Schedule List */}
      <div className="space-y-4">
        {schedule.map((day) => {
          const isActive = day.is_active;
          const dayName = DAYS_MAP[day.day_of_week ?? 0];
          
          return (
            <div 
              key={day.day_of_week} 
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                isActive 
                  ? `bg-white dark:bg-[#141414] border-slate-200 dark:border-zinc-800/50 shadow-sm ring-1 ring-black/5 dark:ring-white/5` 
                  : 'bg-slate-50/50 dark:bg-[#0a0a0a]/50 border-slate-100 dark:border-zinc-900 opacity-70 grayscale-[20%]'
              }`}
            >
              {/* Day Toggle Area */}
              <div className="flex items-center gap-4 mb-4 sm:mb-0 w-48 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleDay(day.day_of_week!)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    isActive ? themeClasses.bg : 'bg-slate-300 dark:bg-zinc-700'
                  }`}
                >
                  <span className="sr-only">Habilitar día</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${
                      isActive ? 'translate-x-2.5' : '-translate-x-2.5'
                    }`}
                  />
                </button>
                <span className={`text-[16px] font-black ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-zinc-500'}`}>
                  {dayName}
                </span>
              </div>

              {/* Time Inputs */}
              {isActive ? (
                <div className="flex items-center gap-3 w-full sm:w-auto flex-1 sm:justify-end animate-in fade-in duration-300">
                  <div className={`flex items-center gap-2 bg-slate-50 dark:bg-[#0a0a0a] p-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-black/5 dark:focus-within:ring-white/5 transition-all`}>
                    <Clock className="w-4 h-4 text-slate-400 dark:text-zinc-500 ml-2" />
                    <input 
                      type="time" 
                      value={formatTimeForInput(day.start_time!)}
                      onChange={(e) => handleTimeChange(day.day_of_week!, 'start_time', e.target.value)}
                      className="bg-transparent border-none text-[15px] font-bold text-slate-900 dark:text-white focus:ring-0 outline-none w-[100px] text-center"
                    />
                  </div>
                  <span className="text-slate-400 dark:text-zinc-500 font-bold text-sm">a</span>
                  <div className={`flex items-center gap-2 bg-slate-50 dark:bg-[#0a0a0a] p-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-black/5 dark:focus-within:ring-white/5 transition-all`}>
                    <Clock className="w-4 h-4 text-slate-400 dark:text-zinc-500 ml-2" />
                    <input 
                      type="time" 
                      value={formatTimeForInput(day.end_time!)}
                      onChange={(e) => handleTimeChange(day.day_of_week!, 'end_time', e.target.value)}
                      className="bg-transparent border-none text-[15px] font-bold text-slate-900 dark:text-white focus:ring-0 outline-none w-[100px] text-center"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end flex-1">
                  <span className="text-[14px] font-bold text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800/50 px-4 py-2 rounded-lg">
                    Día Libre
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
