import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Scissors, Menu, X, LogOut, ChevronDown, Users, Calendar as CalendarIcon, Settings as SettingsIcon, Bell, Moon, Sun, Crown, Home, MoreHorizontal, Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { AdminThemeProvider, useAdminTheme } from './AdminThemeProvider';
import { useTenantSettings } from '../hooks/useTenantSettings';
import { getThemeClasses } from '../utils/theme';

function AdminLayoutInner() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { user, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { theme: adminTheme, toggleTheme } = useAdminTheme();
  const { tenant } = useTenantSettings();
  const themeClasses = getThemeClasses(tenant?.theme_color);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const shopName = user?.user_metadata?.shop_name || 'Admin';
  const email = user?.email || 'admin@barberia.com';
  const initials = shopName.substring(0, 2).toUpperCase();

  const navItems = [
    { name: 'Panel de Control', href: '/admin', icon: LayoutDashboard, mobileIcon: Home },
    { name: 'Agenda', href: '/admin/appointments', icon: CalendarIcon, mobileIcon: CalendarIcon },
    { name: 'Clientes CRM', href: '/admin/clients', icon: Users, mobileIcon: Users },
    { name: 'Personal', href: '/admin/staff', icon: Users },
    { name: 'Servicios', href: '/admin/services', icon: Scissors },
    { name: 'Marca Blanca', href: '/admin/settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0a0a0a] transition-colors duration-200">
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-white dark:bg-[#141414] border-r border-slate-200 dark:border-zinc-800 shadow-sm z-50">
        <div className="h-20 flex items-center px-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${themeClasses.bgLight} ${themeClasses.text}`}>
              <span className="font-black text-sm">{initials}</span>
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{shopName}</h1>
              <p className={`text-[11px] font-bold ${themeClasses.text}`}>Panel de Control</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-semibold text-[14px] ${
                  isActive 
                    ? `${themeClasses.bgLight} ${themeClasses.text}` 
                    : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? themeClasses.text : 'text-slate-400 dark:text-zinc-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Plan Premium Card */}
        <div className="px-4 pb-4">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#0a0a0a] flex flex-col items-center text-center">
            <Crown className={`w-6 h-6 mb-2 ${themeClasses.text}`} />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Plan Premium</h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-4">Aprovecha todas las funciones avanzadas.</p>
            <button className={`w-full py-2 rounded-lg text-[13px] font-bold ${themeClasses.bgLight} ${themeClasses.text} hover:opacity-80 transition-opacity`}>
              Ver Planes
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-2 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
               <div className={`w-9 h-9 rounded-full flex items-center justify-center ${themeClasses.bgLight} ${themeClasses.text} font-bold text-xs`}>
                  {initials}
                </div>
                <div className="text-left flex flex-col w-[120px]">
                  <span className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{shopName}</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{email}</span>
                </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
          </button>

          {isDropdownOpen && (
            <div className="absolute bottom-20 left-4 w-[228px] bg-white dark:bg-[#141414] rounded-xl shadow-xl border border-slate-200 dark:border-zinc-800 py-2 z-50">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Header Desktop & Mobile */}
        <header className="h-16 lg:h-20 flex items-center justify-between px-4 lg:px-8 bg-white dark:bg-[#141414] lg:bg-transparent lg:dark:bg-transparent border-b border-slate-200 dark:border-zinc-800 lg:border-none z-30">
          
          {/* Mobile Left: Hamburger + Title */}
          <div className="flex lg:hidden items-center gap-3">
             <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-500 dark:text-zinc-400"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">RC BARBER SHOP</h2>
              <span className={`text-[10px] font-bold ${themeClasses.text}`}>Panel de Control</span>
            </div>
          </div>

          {/* Desktop Left: Welcome Text */}
          <div className="hidden lg:flex flex-col">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">¡Bienvenido de vuelta, {shopName}! 👋</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">Aquí tienes un resumen de tu negocio.</p>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 lg:gap-4">
             {/* Ir a la Agenda (Desktop) */}
             <Link 
              to="/admin/appointments"
              className={`hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border ${themeClasses.border} ${themeClasses.text} hover:${themeClasses.bgLight} transition-colors`}
             >
               <CalendarIcon className="w-4 h-4" />
               Ir a la Agenda
             </Link>

             {/* Theme Toggle */}
             <button 
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
             >
               {adminTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>

             {/* Notifications */}
             <button className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#141414]"></span>
             </button>
          </div>
        </header>

        {/* Mobile Full Menu Overlay (Optional, or just rely on bottom nav) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative w-64 h-full bg-white dark:bg-[#141414] shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
               <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-zinc-800">
                 <span className="font-extrabold text-slate-900 dark:text-white">Menú</span>
                 <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500 dark:text-zinc-400">
                   <X className="w-6 h-6" />
                 </button>
               </div>
               <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                 {navItems.map((item) => (
                   <Link
                     key={item.href}
                     to={item.href}
                     onClick={() => setIsMobileMenuOpen(false)}
                     className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-[14px] ${
                       location.pathname === item.href 
                         ? `${themeClasses.bgLight} ${themeClasses.text}` 
                         : 'text-slate-500 dark:text-zinc-400'
                     }`}
                   >
                     <item.icon className="w-5 h-5" />
                     {item.name}
                   </Link>
                 ))}
               </nav>
               <div className="p-4 border-t border-slate-200 dark:border-zinc-800">
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 font-semibold">
                    <LogOut className="w-5 h-5" /> Cerrar Sesión
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#141414] border-t border-slate-200 dark:border-zinc-800 flex items-center justify-around px-2 pb-safe pt-2 z-40 h-[72px]">
           <Link to="/admin" className="flex flex-col items-center gap-1 p-2">
             <Home className={`w-6 h-6 ${location.pathname === '/admin' ? themeClasses.text : 'text-slate-400 dark:text-zinc-500'}`} />
             <span className={`text-[10px] font-bold ${location.pathname === '/admin' ? themeClasses.text : 'text-slate-500 dark:text-zinc-400'}`}>Inicio</span>
           </Link>
           <Link to="/admin/appointments" className="flex flex-col items-center gap-1 p-2">
             <CalendarIcon className={`w-6 h-6 ${location.pathname === '/admin/appointments' ? themeClasses.text : 'text-slate-400 dark:text-zinc-500'}`} />
             <span className={`text-[10px] font-bold ${location.pathname === '/admin/appointments' ? themeClasses.text : 'text-slate-500 dark:text-zinc-400'}`}>Agenda</span>
           </Link>
           
           <div className="relative -top-5">
             <button className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${themeClasses.bg} shadow-lg shadow-black/20 hover:scale-105 transition-transform`}>
               <Plus className="w-7 h-7" />
             </button>
           </div>

           <Link to="/admin/clients" className="flex flex-col items-center gap-1 p-2">
             <Users className={`w-6 h-6 ${location.pathname === '/admin/clients' ? themeClasses.text : 'text-slate-400 dark:text-zinc-500'}`} />
             <span className={`text-[10px] font-bold ${location.pathname === '/admin/clients' ? themeClasses.text : 'text-slate-500 dark:text-zinc-400'}`}>Clientes</span>
           </Link>
           <button onClick={() => setIsMobileMenuOpen(true)} className="flex flex-col items-center gap-1 p-2">
             <MoreHorizontal className="w-6 h-6 text-slate-400 dark:text-zinc-500" />
             <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">Más</span>
           </button>
        </div>

      </div>
    </div>
  );
}

export function AdminLayout() {
  return (
    <AdminThemeProvider>
      <AdminLayoutInner />
    </AdminThemeProvider>
  );
}
