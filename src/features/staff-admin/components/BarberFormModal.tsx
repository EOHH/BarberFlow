import { useState, useEffect, useRef } from 'react';
import type { Barber } from '../../../types';
import { X as XIcon, User, Upload, Loader2, Mail, Star, FileText, ImagePlus } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';
import { useTenantSettings } from '../../../shared/hooks/useTenantSettings';
import { getThemeClasses } from '../../../shared/utils/theme';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (barber: Partial<Barber>) => Promise<void>;
  initialData?: Barber | null;
  uploadAvatar: (file: File) => Promise<string>;
}

export function BarberFormModal({ isOpen, onClose, onSave, initialData, uploadAvatar }: Props) {
  const { tenant } = useTenantSettings();
  const themeClasses = getThemeClasses(tenant?.theme_color);
  
  const [formData, setFormData] = useState<Partial<Barber>>({ name: '', specialty: '', bio: '', avatar_url: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({ 
        name: initialData.name,
        email: initialData.email || '',
        specialty: initialData.specialty || '',
        bio: initialData.bio || '',
        avatar_url: initialData.avatar_url || ''
      });
      setAvatarPreview(initialData.avatar_url || null);
    } else {
      setFormData({ name: '', email: '', specialty: '', bio: '', avatar_url: '' });
      setAvatarPreview(null);
    }
    setFileToUpload(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      setFileToUpload(compressedFile);
      setAvatarPreview(URL.createObjectURL(compressedFile));
    } catch (error) {
      toast.error('Error al procesar la imagen.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;
    
    setIsSubmitting(true);
    try {
      let finalAvatarUrl = formData.avatar_url;
      if (fileToUpload) {
        finalAvatarUrl = await uploadAvatar(fileToUpload);
      }

      const dataToSave = { 
        name: formData.name.trim(),
        email: formData.email?.trim() || undefined,
        specialty: formData.specialty?.trim(),
        bio: formData.bio?.trim(),
        avatar_url: finalAvatarUrl
      };

      await onSave(dataToSave);
      toast.success(initialData ? 'Barbero actualizado' : 'Barbero creado');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al guardar el barbero: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white dark:bg-[#0a0a0a] w-full max-w-lg rounded-[24px] shadow-2xl border border-slate-200 dark:border-zinc-800/50 p-8 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] scrollbar-hide">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${themeClasses.bgLight} flex items-center justify-center ${themeClasses.text} shadow-inner border border-black/5 dark:border-white/5`}>
              <User className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {initialData ? 'Editar Perfil' : 'Nuevo Barbero'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">Configura los datos del profesional</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/50 rounded-full transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload Premium Dropzone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center border border-slate-200 dark:border-zinc-800/50 bg-slate-50 dark:bg-[#141414] hover:${themeClasses.bgLight} rounded-3xl p-8 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md`}
          >
            {avatarPreview ? (
              <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-md mb-4 group-hover:scale-105 transition-transform duration-500 border-4 border-white dark:border-[#222]">
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Upload className="w-7 h-7 text-white drop-shadow-md" />
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-white dark:bg-[#1a1a1a] shadow-sm flex items-center justify-center text-slate-300 dark:text-zinc-700 mb-4 group-hover:scale-110 group-hover:shadow-md transition-all duration-300 border border-slate-100 dark:border-zinc-800">
                <ImagePlus className="w-8 h-8" />
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageChange}
            />
            <p className={`text-sm font-bold text-slate-700 dark:text-zinc-300 group-hover:${themeClasses.text} transition-colors`}>
              Haz clic para subir una foto premium
            </p>
            <p className="text-xs text-slate-400 dark:text-zinc-600 mt-1 font-medium">PNG, JPG hasta 5MB</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300">Nombre Completo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                <User className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                required
                placeholder="Ej. Carlos Mendoza"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-2xl focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all outline-none shadow-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                <Mail className="w-5 h-5" />
              </div>
              <input 
                type="email" 
                placeholder="carlos@barbershop.com"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-2xl focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all outline-none shadow-sm font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300">Especialidad</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                <Star className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                placeholder="Ej. Fade & Barba, Colorimetría"
                value={formData.specialty || ''}
                onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-2xl focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all outline-none shadow-sm font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300">Biografía Breve</label>
            <div className="relative">
              <div className="absolute top-4 left-0 pl-4 pointer-events-none text-slate-400 dark:text-zinc-500">
                <FileText className="w-5 h-5" />
              </div>
              <textarea 
                placeholder="Describe su experiencia o estilo (opcional)"
                value={formData.bio || ''}
                rows={3}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-2xl focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all outline-none resize-none shadow-sm font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-4 border-t border-slate-100 dark:border-zinc-800/50 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 text-sm font-bold text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl transition-all hover:-translate-y-0.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name?.trim()}
              className={`flex items-center justify-center min-w-[140px] gap-2 px-8 py-3.5 text-sm font-black ${themeClasses.bg} text-white rounded-xl transition-all hover:-translate-y-0.5 shadow-md disabled:opacity-70 disabled:hover:translate-y-0`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Perfil'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
