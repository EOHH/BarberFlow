import { useState } from 'react';
import { useStaffAdmin } from '../../shared/hooks/useStaffAdmin';
import { toast } from 'sonner';
import type { Barber } from '../../types';
import { BarberFormModal } from './components/BarberFormModal';
import { Plus, Edit2, Trash2, User, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTenantSettings } from '../../shared/hooks/useTenantSettings';
import { getThemeClasses } from '../../shared/utils/theme';

export function StaffAdminPage() {
  const { barbers, isLoading, createBarber, updateBarber, deleteBarber, uploadAvatar } = useStaffAdmin();
  const { tenant } = useTenantSettings();
  const themeClasses = getThemeClasses(tenant?.theme_color);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

  const handleOpenNew = () => {
    setEditingBarber(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (barber: Barber) => {
    setEditingBarber(barber);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    toast('¿Eliminar barbero?', {
      description: 'Esto podría afectar citas históricas asociadas a él.',
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            await deleteBarber(id);
            toast.success("Barbero eliminado exitosamente");
          } catch (error) {
            toast.error("No se pudo eliminar. Puede tener citas asociadas.");
          }
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {}
      }
    });
  };

  const handleSave = async (data: Partial<Barber>) => {
    if (editingBarber) {
      await updateBarber({ id: editingBarber.id, data });
    } else {
      await createBarber(data);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Personal</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">Administra los barberos y su disponibilidad.</p>
        </div>
        
        <button 
          onClick={handleOpenNew}
          className={`flex items-center gap-2 ${themeClasses.bg} text-white px-5 py-2.5 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-md`}
        >
          <Plus className="w-5 h-5" />
          Nuevo Barbero
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-zinc-400 font-medium animate-pulse">
            Cargando personal...
          </div>
        ) : barbers.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-[24px] p-12 text-center shadow-sm">
            <User className="w-12 h-12 text-slate-300 dark:text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Sin personal</h3>
            <p className="text-slate-500 dark:text-zinc-400 mb-4 font-medium">No tienes barberos registrados en tu negocio.</p>
            <button onClick={handleOpenNew} className={`${themeClasses.text} font-bold hover:underline`}>
              Agregar tu primer barbero
            </button>
          </div>
        ) : (
          barbers.map((barber) => (
            <div key={barber.id} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-[24px] p-6 shadow-sm flex flex-col hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-5">
                {barber.avatar_url ? (
                  <img src={barber.avatar_url} alt={barber.name} className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-zinc-700 shadow-sm" />
                ) : (
                  <div className={`w-14 h-14 rounded-2xl ${themeClasses.bgLight} flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5`}>
                    <span className={`text-xl font-black ${themeClasses.text}`}>{barber.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenEdit(barber)}
                    className={`p-2.5 text-slate-400 hover:${themeClasses.text} bg-slate-100 dark:bg-zinc-800/50 hover:${themeClasses.bgLight} rounded-xl transition-colors`}
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(barber.id)}
                    className="p-2.5 text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-zinc-800/50 hover:bg-rose-500/10 rounded-xl transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">{barber.name}</h3>
              <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-6">
                Añadido el {new Date(barber.created_at).toLocaleDateString('es-ES')}
              </p>
              
              <div className="mt-auto pt-5 border-t border-slate-100 dark:border-zinc-800/50">
                <Link
                  to={`/admin/staff/${barber.id}/availability`}
                  className={`w-full flex items-center justify-center gap-2 bg-slate-50 dark:bg-[#0a0a0a] hover:${themeClasses.bgLight} text-slate-700 dark:text-zinc-300 hover:${themeClasses.text} text-sm font-black py-3.5 rounded-xl transition-colors border border-slate-200 dark:border-zinc-800/50 hover:border-transparent`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Gestionar Horario
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <BarberFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingBarber}
        uploadAvatar={uploadAvatar}
      />
    </div>
  );
}
