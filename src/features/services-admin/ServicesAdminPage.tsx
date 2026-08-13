import { useState } from 'react';
import { useServicesAdmin } from '../../shared/hooks/useServicesAdmin';
import { toast } from 'sonner';
import type { Service } from '../../types';
import { ServiceFormModal } from './components/ServiceFormModal';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useTenantSettings } from '../../shared/hooks/useTenantSettings';
import { getThemeClasses } from '../../shared/utils/theme';

export function ServicesAdminPage() {
  const { services, isLoading, createService, updateService, deleteService, uploadImage } = useServicesAdmin();
  const { tenant } = useTenantSettings();
  const themeClasses = getThemeClasses(tenant?.theme_color);
  
  // Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const handleOpenNew = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    toast('¿Eliminar servicio?', {
      description: 'Esta acción no se puede deshacer.',
      action: {
        label: 'Eliminar',
        onClick: async () => {
          try {
            await deleteService(id);
            toast.success("Servicio eliminado");
          } catch (error) {
            toast.error("No se pudo eliminar el servicio");
          }
        }
      },
      cancel: { label: 'Cancelar', onClick: () => {} }
    });
  };

  const handleSave = async (serviceData: Partial<Omit<Service, 'id' | 'created_at'>>) => {
    if (editingService) {
      await updateService({ id: editingService.id, data: serviceData });
    } else {
      await createService(serviceData as Omit<Service, 'id' | 'created_at'>);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Catálogo de Servicios</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">Administra los servicios ofrecidos en la barbería.</p>
        </div>
        
        <button 
          onClick={handleOpenNew}
          className={`flex items-center gap-2 ${themeClasses.bg} text-white px-5 py-2.5 rounded-xl font-bold transition-all hover:scale-[1.02] shadow-md`}
        >
          <Plus className="w-5 h-5" />
          Nuevo Servicio
        </button>
      </div>

      <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-[24px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/50 dark:bg-[#0a0a0a]/50 text-slate-500 dark:text-zinc-400 text-xs uppercase tracking-wider font-bold border-b border-slate-200 dark:border-zinc-800/50">
              <tr>
                <th className="px-6 py-5">Servicio</th>
                <th className="px-6 py-5 hidden sm:table-cell">Estado</th>
                <th className="px-6 py-5 hidden sm:table-cell">Duración</th>
                <th className="px-6 py-5">Precio</th>
                <th className="px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-zinc-400 font-medium">
                    Cargando servicios...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-zinc-400 font-medium">
                    No hay servicios registrados. Haz clic en "Nuevo Servicio" para comenzar.
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {service.image_url ? (
                          <img src={service.image_url} alt={service.name} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-zinc-700 shadow-sm" />
                        ) : (
                          <div className={`w-12 h-12 rounded-xl ${themeClasses.bgLight} flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5`}>
                            <span className={`text-lg font-black ${themeClasses.text}`}>{service.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-base text-slate-900 dark:text-white">{service.name}</div>
                          {service.description && (
                            <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-1 font-medium">{service.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      {service.is_active !== false ? (
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Activo</span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">Inactivo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-zinc-400 font-medium hidden sm:table-cell">{service.duration_minutes} min</td>
                    <td className="px-6 py-4 whitespace-nowrap font-black text-slate-900 dark:text-white text-base">
                      S/ {Number(service.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button 
                        onClick={() => handleOpenEdit(service)}
                        className={`p-2.5 text-slate-400 hover:${themeClasses.text} bg-slate-100 dark:bg-zinc-800/50 hover:${themeClasses.bgLight} rounded-xl transition-colors`}
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(service.id)}
                        className="p-2.5 text-slate-400 hover:text-rose-500 bg-slate-100 dark:bg-zinc-800/50 hover:bg-rose-500/10 rounded-xl transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ServiceFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingService}
        uploadImage={uploadImage}
      />
    </div>
  );
}
