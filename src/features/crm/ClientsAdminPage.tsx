import { useState, useMemo } from 'react';
import { useClientsAdmin } from '../../shared/hooks/useClientsAdmin';
import type { Client } from '../../types';
import { Search, User, Phone, DollarSign, Calendar, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTenantSettings } from '../../shared/hooks/useTenantSettings';
import { getThemeClasses } from '../../shared/utils/theme';

export function ClientsAdminPage() {
  const { clients, isLoading, updateClientNotes } = useClientsAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const { tenant } = useTenantSettings();
  const themeClasses = getThemeClasses(tenant?.theme_color);

  // Filtrado reactivo
  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    const lower = searchTerm.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(lower) || 
      c.phone.includes(lower)
    );
  }, [clients, searchTerm]);

  const handleOpenProfile = (client: Client) => {
    setSelectedClient(client);
    setNotesDraft(client.private_notes || '');
  };

  const handleSaveNotes = async () => {
    if (!selectedClient) return;
    setIsSavingNotes(true);
    try {
      await updateClientNotes({ id: selectedClient.id, notes: notesDraft });
      setSelectedClient({ ...selectedClient, private_notes: notesDraft });
      toast.success("Notas guardadas correctamente");
    } catch (err) {
      toast.error("Error al guardar las notas");
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">CRM / Clientes</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">Conoce a tus clientes, historial y LTV (Lifetime Value).</p>
        </div>
        
        {/* Buscador */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-xl focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 outline-none transition-shadow text-slate-900 dark:text-white font-medium placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Lista de Clientes (Data Grid Premium) */}
        <div className={`flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide ${selectedClient ? 'hidden lg:block' : 'block'}`}>
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-zinc-800/50 rounded-2xl"></div>)}
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-2xl p-12 text-center shadow-sm">
              <User className="w-12 h-12 text-slate-300 dark:text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Sin resultados</h3>
              <p className="text-slate-500 dark:text-zinc-400 font-medium">No encontramos clientes que coincidan con tu búsqueda.</p>
            </div>
          ) : (
            filteredClients.map(client => (
              <button
                key={client.id}
                onClick={() => handleOpenProfile(client)}
                className={`w-full text-left bg-white dark:bg-[#141414] border rounded-2xl p-4 md:p-5 shadow-sm transition-all flex items-center justify-between gap-4 ${
                  selectedClient?.id === client.id 
                  ? 'border-black/20 dark:border-white/20 ring-1 ring-black/10 dark:ring-white/10' 
                  : 'border-slate-200 dark:border-zinc-800/50 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${themeClasses.bgLight} ${themeClasses.text} flex items-center justify-center shrink-0`}>
                    <span className="font-bold text-lg md:text-xl">{client.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-white truncate">{client.name}</h3>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 font-medium truncate">{client.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 md:gap-6 shrink-0">
                  <div className="hidden sm:block text-right">
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Visitas</p>
                    <p className="font-bold text-sm md:text-base text-slate-900 dark:text-white">{client.total_visits}</p>
                  </div>
                  <div className="text-right w-20 md:w-24">
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-500/70">LTV</p>
                    <p className="font-black text-sm md:text-base text-emerald-600 dark:text-emerald-400">S/ {client.ltv?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Perfil 360 (Side Panel) */}
        {selectedClient && (
          <div className="w-full lg:w-96 shrink-0 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-zinc-800/50 rounded-[24px] shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-right-4 fade-in duration-300 h-full">
            <div className="p-5 border-b border-slate-100 dark:border-zinc-800/50 bg-slate-50 dark:bg-[#141414] flex justify-between items-center shrink-0">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white">Perfil 360</h2>
              <button onClick={() => setSelectedClient(null)} className="p-2 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-full transition-colors lg:hidden">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {/* Header de perfil */}
              <div className="text-center">
                <div className={`w-24 h-24 rounded-full ${themeClasses.bgLight} ${themeClasses.text} flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-[#0a0a0a] shadow-sm`}>
                  <span className="font-black text-4xl">{selectedClient.name.charAt(0).toUpperCase()}</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedClient.name}</h2>
                <div className="flex items-center justify-center gap-1.5 text-slate-500 dark:text-zinc-400 font-medium mt-1">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{selectedClient.phone}</span>
                </div>
                <p className="text-xs font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-wider mt-4">
                  Cliente desde {new Date(selectedClient.created_at).toLocaleDateString('es-ES')}
                </p>
              </div>

              {/* Bento Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-2xl p-5 text-center transition-all hover:shadow-md">
                  <Calendar className={`w-6 h-6 mx-auto mb-3 ${themeClasses.text}`} />
                  <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Visitas Totales</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{selectedClient.total_visits}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-5 text-center transition-all hover:shadow-md">
                  <DollarSign className="w-6 h-6 mx-auto mb-3 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider mb-1">LTV (Ingresos)</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">S/ {selectedClient.ltv?.toFixed(2) || '0.00'}</p>
                </div>
              </div>

              {/* Notas Privadas */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <FileText className={`w-4 h-4 ${themeClasses.text}`} />
                  Notas Internas
                </div>
                <textarea 
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Ej. Alergia a la navaja, le gusta el café con azúcar..."
                  className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-xl focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 outline-none resize-none text-sm font-medium text-slate-700 dark:text-zinc-300 placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                />
                {notesDraft !== selectedClient.private_notes && (
                  <button 
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className={`w-full py-3.5 ${themeClasses.bg} text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-md`}
                  >
                    {isSavingNotes ? 'Guardando...' : 'Guardar Notas'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
