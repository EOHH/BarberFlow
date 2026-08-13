import { useMemo } from 'react';
import { useDashboardMetrics } from '../../shared/hooks/useDashboardMetrics';
import { useServicesAdmin } from '../../shared/hooks/useServicesAdmin';
import { useStaffAdmin } from '../../shared/hooks/useStaffAdmin';
import { Calendar as CalendarIcon, DollarSign, Clock, TrendingUp, CheckCircle2, UserPlus, Scissors, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { useTenantSettings } from '../../shared/hooks/useTenantSettings';
import { getThemeClasses } from '../../shared/utils/theme';

const TIME_ZONE = 'America/Lima';

export function DashboardPage() {
  const { appointments, isLoading: isLoadingMetrics } = useDashboardMetrics();
  const { services, isLoading: isLoadingServices } = useServicesAdmin();
  const { barbers, isLoading: isLoadingBarbers } = useStaffAdmin();
  
  const { tenant } = useTenantSettings();
  const themeClasses = getThemeClasses(tenant?.theme_color);

  // Get today's date string in Lima timezone
  const todayStr = useMemo(() => {
    return formatInTimeZone(toZonedTime(new Date(), TIME_ZONE), TIME_ZONE, 'yyyy-MM-dd');
  }, []);

  const metrics = useMemo(() => {
    let todayRevenue = 0;
    let weekRevenue = 0;
    let todayCompletedCount = 0;
    let todayPendingCount = 0;
    
    // Monthly metrics
    let currentMonthRevenue = 0;
    let currentMonthCompletedCount = 0;
    let previousMonthRevenue = 0;
    let previousMonthCompletedCount = 0;

    const currentDate = new Date(todayStr); 
    const currentMonthPrefix = todayStr.substring(0, 7); 
    
    const prevDate = new Date(currentDate);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonthPrefix = prevDate.toISOString().substring(0, 7);
    
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const dailyRevenue = Array(daysInMonth).fill(0);

    const completedAppointments: typeof appointments = [];
    const pendingAppointments: typeof appointments = [];

    appointments.forEach(app => {
      const service = services.find(s => s.id === app.service_id);
      const price = service ? Number(service.price) : 0;

      if (app.status === 'completed') {
        weekRevenue += price;
        completedAppointments.push(app);

        if (app.date === todayStr) {
          todayRevenue += price;
          todayCompletedCount++;
        }
        
        const appMonth = app.date.substring(0, 7);
        if (appMonth === currentMonthPrefix) {
          currentMonthRevenue += price;
          currentMonthCompletedCount++;
          
          const day = parseInt(app.date.substring(8, 10), 10);
          if (day >= 1 && day <= daysInMonth) {
             dailyRevenue[day - 1] += price;
          }
        } else if (appMonth === prevMonthPrefix) {
          previousMonthRevenue += price;
          previousMonthCompletedCount++;
        }
      } else if (app.status === 'pending' || app.status === 'confirmed') {
        if (app.date >= todayStr) {
          pendingAppointments.push(app);
        }
        if (app.date === todayStr) {
          todayPendingCount++;
        }
      }
    });

    // Sort by date/time descending to get recent 5
    const recentCompleted = completedAppointments
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
      
    // Sort by date/time ascending to get upcoming 3
    const upcoming = pendingAppointments
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 3);

    const revenueGrowth = previousMonthRevenue === 0 
      ? (currentMonthRevenue > 0 ? 100 : 0) 
      : ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

    const countGrowth = previousMonthCompletedCount === 0 
      ? (currentMonthCompletedCount > 0 ? 100 : 0) 
      : ((currentMonthCompletedCount - previousMonthCompletedCount) / previousMonthCompletedCount) * 100;

    const maxDailyRevenue = Math.max(...dailyRevenue, 1);
    const points = [];
    for (let i = 0; i < daysInMonth; i++) {
       const x = (i / (daysInMonth - 1)) * 400;
       const y = 100 - ((dailyRevenue[i] / maxDailyRevenue) * 80); 
       points.push(`${x},${y}`);
    }
    
    const linePath = points.length > 0 ? `M ${points[0]} ` + points.slice(1).map(p => `L ${p}`).join(' ') : 'M 0,100 L 400,100';
    const areaPath = points.length > 0 ? `${linePath} L 400,100 L 0,100 Z` : 'M 0,100 L 400,100 Z';

    const currentMonthName = formatInTimeZone(toZonedTime(currentDate, TIME_ZONE), TIME_ZONE, "MMMM yyyy", { locale: es });
    const prevMonthName = formatInTimeZone(toZonedTime(prevDate, TIME_ZONE), TIME_ZONE, "MMMM", { locale: es });

    return {
      todayRevenue,
      weekRevenue,
      todayCompletedCount,
      todayPendingCount,
      recentCompleted,
      upcoming,
      totalWeekAppointments: completedAppointments.length + pendingAppointments.filter(a => a.date >= todayStr).length,
      currentMonthRevenue,
      currentMonthCompletedCount,
      revenueGrowth,
      countGrowth,
      maxDailyRevenue,
      linePath,
      areaPath,
      currentMonthName,
      prevMonthName
    };
  }, [appointments, services, todayStr]);

  const isLoading = isLoadingMetrics || isLoadingServices || isLoadingBarbers;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center animate-pulse">
        <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${themeClasses.border}`}></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        
        {/* Ingresos del Día */}
        <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-[24px] p-6 lg:p-8 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h3 className="text-slate-500 dark:text-zinc-400 font-semibold mb-2 text-sm">Ingresos del Día</h3>
              <div className="text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white flex items-center mb-6">
                <span className="text-slate-400 dark:text-zinc-600 mr-2 text-3xl lg:text-4xl">S/</span>
                {metrics.todayRevenue.toFixed(2)}
              </div>
            </div>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#0a0a0a] ${themeClasses.text}`}>
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-[13px] font-bold">
              <TrendingUp className="w-4 h-4" />
              +12% vs ayer
            </div>
            <span className="text-slate-500 dark:text-zinc-500 text-[13px] font-medium">
              {metrics.todayCompletedCount} citas completadas hoy
            </span>
          </div>
          {/* Subtle Glow */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-slate-200 dark:bg-white/5 blur-3xl rounded-full pointer-events-none"></div>
        </div>

        {/* Ingresos de la Semana */}
        <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-[24px] p-6 lg:p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h3 className="text-slate-500 dark:text-zinc-400 font-semibold mb-2 text-sm">Ingresos de la Semana</h3>
              <div className="text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white flex items-center mb-6">
                <span className="text-slate-400 dark:text-zinc-600 mr-2 text-2xl lg:text-3xl">S/</span>
                {metrics.weekRevenue.toFixed(2)}
              </div>
            </div>
            
            {/* Chart Ring Placeholder */}
            <div className="relative w-16 h-16 lg:w-20 lg:h-20">
               <svg viewBox="0 0 36 36" className="w-full h-full">
                  <path
                    className="text-slate-100 dark:text-zinc-800"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className={themeClasses.text}
                    strokeDasharray="75, 100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center">
                 <BarChart3 className={`w-5 h-5 ${themeClasses.text}`} />
               </div>
            </div>
          </div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-slate-50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-[12px] font-semibold">
              <CalendarIcon className={`w-4 h-4 ${themeClasses.text}`} />
              Últimos 7 días móviles
            </div>
          </div>
        </div>

      </div>

      {/* 4 Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {/* Citas Hoy */}
         <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-2xl p-5 flex flex-col justify-between">
           <div className="flex justify-between items-start mb-4">
             <div className="text-slate-500 dark:text-zinc-400 text-xs font-semibold">Citas Hoy</div>
             <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
               <CalendarIcon className="w-4 h-4" />
             </div>
           </div>
           <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">{metrics.todayCompletedCount + metrics.todayPendingCount}</div>
           <div className="text-[11px] text-slate-500 dark:text-zinc-500 font-medium">0% completadas</div>
         </div>

         {/* Citas Semana */}
         <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-2xl p-5 flex flex-col justify-between">
           <div className="flex justify-between items-start mb-4">
             <div className="text-slate-500 dark:text-zinc-400 text-xs font-semibold">Citas Semana</div>
             <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
               <CalendarIcon className="w-4 h-4" />
             </div>
           </div>
           <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">{metrics.totalWeekAppointments}</div>
           <div className="text-[11px] text-green-600 dark:text-green-400 font-bold">+100% vs semana pasada</div>
         </div>

         {/* Clientes Nuevos */}
         <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-2xl p-5 flex flex-col justify-between">
           <div className="flex justify-between items-start mb-4">
             <div className="text-slate-500 dark:text-zinc-400 text-xs font-semibold">Clientes Nuevos</div>
             <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
               <UserPlus className="w-4 h-4" />
             </div>
           </div>
           <div className="text-3xl font-black text-slate-900 dark:text-white mb-2">0</div>
           <div className="text-[11px] text-slate-500 dark:text-zinc-500 font-medium">0% vs semana pasada</div>
         </div>

         {/* Servicios Más Vendidos */}
         <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-2xl p-5 flex flex-col justify-between">
           <div className="flex justify-between items-start mb-4">
             <div className="text-slate-500 dark:text-zinc-400 text-[11px] sm:text-xs font-semibold leading-tight">Servicios Más Vendidos</div>
             <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
               <Scissors className="w-4 h-4" />
             </div>
           </div>
           <div className="text-sm font-bold text-slate-900 dark:text-white mb-2 truncate">
              {services[0]?.name || 'N/A'}
           </div>
           <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">{appointments.length} reservas</div>
         </div>
      </div>

      {/* Bottom Area: Lists and Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        
        {/* Lists Column */}
        <div className="flex flex-col gap-4 lg:gap-6">
           
           {/* Últimas Citas Completadas */}
           <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-[24px] shadow-sm overflow-hidden flex flex-col">
             <div className="p-5 border-b border-slate-100 dark:border-zinc-800/50 flex justify-between items-center">
               <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                 <Clock className={`w-4 h-4 ${themeClasses.text}`} />
                 Últimas Citas Completadas
               </h2>
               <Link to="/admin/appointments" className={`text-xs font-bold ${themeClasses.text} hover:underline`}>Ver todas</Link>
             </div>
             
             <div className="p-0 flex-1">
                {metrics.recentCompleted.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 dark:text-zinc-500 text-sm">
                    No hay citas completadas recientes.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                    {metrics.recentCompleted.map((app) => {
                      const barber = barbers.find(b => b.id === app.barber_id);
                      const service = services.find(s => s.id === app.service_id);
                      return (
                        <div key={app.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {barber?.avatar_url ? (
                                <img src={barber.avatar_url} alt={barber.name} className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${themeClasses.bgLight} ${themeClasses.text}`}>
                                  {barber?.name?.charAt(0) || 'B'}
                                </div>
                              )}
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-[#141414] rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{app.client_name}</h4>
                              <p className={`text-[11px] font-semibold ${themeClasses.text}`}>{service?.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-zinc-500">Atendido por {barber?.name}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                              S/ {service?.price.toFixed(2) || '0.00'}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                              <CalendarIcon className="w-3 h-3" />
                              {app.date.split('-').reverse().join('/')} - {app.time.substring(0, 5)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
             </div>
           </div>

           {/* Próximas Citas */}
           <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-[24px] shadow-sm overflow-hidden flex flex-col">
             <div className="p-5 border-b border-slate-100 dark:border-zinc-800/50 flex justify-between items-center">
               <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                 Próximas Citas
               </h2>
               <Link to="/admin/appointments" className={`text-xs font-bold ${themeClasses.text} hover:underline`}>Ver agenda</Link>
             </div>
             
             <div className="p-0 flex-1">
                {metrics.upcoming.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 dark:text-zinc-500 text-sm">
                    No hay citas próximas.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                    {metrics.upcoming.map((app) => {
                      const barber = barbers.find(b => b.id === app.barber_id);
                      const service = services.find(s => s.id === app.service_id);
                      return (
                        <div key={app.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {barber?.avatar_url ? (
                                <img src={barber.avatar_url} alt={barber.name} className="w-10 h-10 rounded-full object-cover grayscale opacity-80" />
                              ) : (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400`}>
                                  {barber?.name?.charAt(0) || 'B'}
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{app.client_name}</h4>
                              <p className={`text-[11px] font-semibold ${themeClasses.text}`}>{service?.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-zinc-500">{barber?.name}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-semibold text-[11px] text-slate-500 dark:text-zinc-400">
                              {app.date.split('-').reverse().join('/')}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                              {app.time.substring(0, 5)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <div className="p-4 border-t border-slate-100 dark:border-zinc-800/50">
                   <Link to="/admin/appointments" className={`w-full py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 flex justify-center text-sm font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors`}>
                      Ver agenda completa
                   </Link>
                </div>
             </div>
           </div>

        </div>

        {/* Resumen Mensual (Chart con Datos Reales) */}
        <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-[24px] p-6 shadow-sm flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-sm font-bold text-slate-900 dark:text-white">Resumen Mensual</h3>
             <select className="bg-slate-50 dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none capitalize">
                <option>{metrics.currentMonthName}</option>
             </select>
          </div>

          <div className="flex items-start gap-8 mb-8">
             <div>
               <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">Ingresos</div>
               <div className="text-2xl font-black text-slate-900 dark:text-white">S/ {metrics.currentMonthRevenue.toFixed(2)}</div>
               <div className={`text-[10px] font-bold mt-1 ${metrics.revenueGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                 {metrics.revenueGrowth >= 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(0)}% vs {metrics.prevMonthName}
               </div>
             </div>
             <div>
               <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1">Citas Completadas</div>
               <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.currentMonthCompletedCount}</div>
               <div className={`text-[10px] font-bold mt-1 ${metrics.countGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                 {metrics.countGrowth >= 0 ? '+' : ''}{metrics.countGrowth.toFixed(0)}% vs {metrics.prevMonthName}
               </div>
             </div>
          </div>

          <div className="flex-1 relative w-full h-full flex items-end">
             <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible preserve-aspect-ratio-none">
               <defs>
                 <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                   <stop offset="0%" stopColor="currentColor" className={themeClasses.text} stopOpacity="0.2" />
                   <stop offset="100%" stopColor="currentColor" className={themeClasses.text} stopOpacity="0" />
                 </linearGradient>
               </defs>
               <path
                 d={metrics.areaPath}
                 fill="url(#gradient)"
               />
               <path
                 d={metrics.linePath}
                 fill="none"
                 stroke="currentColor"
                 strokeWidth="3"
                 className={themeClasses.text}
                 vectorEffect="non-scaling-stroke"
               />
             </svg>

             {/* Y Axis labels */}
             <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-slate-400 dark:text-zinc-600 pb-6 pointer-events-none">
                <span>S/ {metrics.maxDailyRevenue.toFixed(0)}</span>
                <span>S/ {(metrics.maxDailyRevenue * 0.66).toFixed(0)}</span>
                <span>S/ {(metrics.maxDailyRevenue * 0.33).toFixed(0)}</span>
                <span>S/ 0</span>
             </div>

             {/* X Axis labels */}
             <div className="absolute bottom-0 left-8 right-0 flex justify-between text-[10px] text-slate-400 dark:text-zinc-500 font-medium pt-2 border-t border-slate-100 dark:border-zinc-800">
               <span>Día 1</span>
               <span>Día 8</span>
               <span>Día 15</span>
               <span>Día 22</span>
               <span>Fin</span>
             </div>
          </div>
        </div>

      </div>

    </div>
  );
}
