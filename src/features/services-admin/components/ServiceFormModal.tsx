import { useState, useEffect, useRef } from 'react';
import type { Service } from '../../../types';
import { X as XIcon, Upload, Loader2, Image as ImageIcon, Plus, Check, Clock, DollarSign, Type, FileText, Tag, ImagePlus } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';
import { useCategoriesAdmin } from '../../../shared/hooks/useCategoriesAdmin';
import { useTenantSettings } from '../../../shared/hooks/useTenantSettings';
import { getThemeClasses } from '../../../shared/utils/theme';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Partial<Omit<Service, 'id' | 'created_at'>>) => Promise<void>;
  initialData?: Service | null;
  uploadImage: (file: File) => Promise<string>;
}

export function ServiceFormModal({ isOpen, onClose, onSave, initialData, uploadImage }: Props) {
  const { tenant } = useTenantSettings();
  const themeClasses = getThemeClasses(tenant?.theme_color);
  const { categories, isLoading: loadingCategories, createCategory, isCreating: creatingCategory } = useCategoriesAdmin();
  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    description: '',
    duration_minutes: 30,
    price: 0,
    image_url: '',
    icon_name: '',
    category_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  
  // Inline category creation state
  const [isInlineCreatingCategory, setIsInlineCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description || '',
        duration_minutes: initialData.duration_minutes,
        price: initialData.price,
        image_url: initialData.image_url || '',
        icon_name: initialData.icon_name || '',
        category_id: initialData.category_id || ''
      });
      setImagePreview(initialData.image_url || null);
    } else {
      setFormData({ name: '', description: '', duration_minutes: 30, price: 0, image_url: '', icon_name: '', category_id: '' });
      setImagePreview(null);
    }
    setFileToUpload(null);
    setIsInlineCreatingCategory(false);
    setNewCategoryName('');
  }, [initialData, isOpen]);

  // Set default category if none selected and categories exist
  useEffect(() => {
    if (categories.length > 0 && !formData.category_id) {
      setFormData(prev => ({ ...prev, category_id: categories[0].id }));
    }
  }, [categories, formData.category_id]);

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
      setImagePreview(URL.createObjectURL(compressedFile));
    } catch (error) {
      toast.error('Error al procesar la imagen.');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName || !newCategoryName.trim()) return;
    try {
      const newCat = await createCategory(newCategoryName.trim());
      setFormData(prev => ({ ...prev, category_id: newCat.id }));
      toast.success("Categoría creada exitosamente");
      setIsInlineCreatingCategory(false);
      setNewCategoryName('');
    } catch (error: any) {
      toast.error(`Error al crear categoría: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    setIsSubmitting(true);
    try {
      let finalImageUrl = formData.image_url;
      if (fileToUpload) {
        finalImageUrl = await uploadImage(fileToUpload);
      }

      await onSave({
        name: formData.name.trim(),
        description: formData.description?.trim(),
        duration_minutes: formData.duration_minutes,
        price: formData.price,
        image_url: finalImageUrl,
        icon_name: formData.icon_name?.trim() || undefined,
        category_id: formData.category_id || undefined
      });
      toast.success(initialData ? 'Servicio actualizado' : 'Servicio creado');
      onClose();
    } catch (err: any) {
      toast.error(`Error al guardar el servicio: ${err.message || err}`);
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
              <ImageIcon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {initialData ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">Configura los detalles del servicio</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/50 rounded-full transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Premium Dropzone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center border border-slate-200 dark:border-zinc-800/50 bg-slate-50 dark:bg-[#141414] hover:${themeClasses.bgLight} rounded-3xl p-8 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md`}
          >
            {imagePreview ? (
              <div className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-md mb-4 group-hover:scale-105 transition-transform duration-500 border border-slate-200 dark:border-zinc-700">
                <img src={imagePreview} alt="Servicio" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Upload className="w-8 h-8 text-white drop-shadow-md" />
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
            <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300">Nombre del Servicio</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                <Type className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                required
                placeholder="Ej. Corte Clásico"
                value={formData.name || ''}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-2xl focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all outline-none font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 shadow-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300">Categoría</label>
                {!isInlineCreatingCategory && (
                  <button 
                    type="button" 
                    onClick={() => setIsInlineCreatingCategory(true)}
                    disabled={creatingCategory || loadingCategories}
                    className={`text-xs ${themeClasses.text} font-bold flex items-center hover:underline disabled:opacity-50 transition-all`}
                  >
                    <Plus className="w-3.5 h-3.5 mr-0.5" />
                    Nueva
                  </button>
                )}
              </div>
              
              {isInlineCreatingCategory ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nombre..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    autoFocus
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-2xl focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all outline-none shadow-sm font-bold text-slate-900 dark:text-white disabled:opacity-50"
                    disabled={creatingCategory}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCategory();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={creatingCategory || !newCategoryName.trim()}
                    className={`p-3.5 ${themeClasses.bgLight} ${themeClasses.text} rounded-2xl transition-all disabled:opacity-50 hover:-translate-y-0.5`}
                  >
                    {creatingCategory ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsInlineCreatingCategory(false);
                      setNewCategoryName('');
                    }}
                    disabled={creatingCategory}
                    className="p-3.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-2xl transition-all disabled:opacity-50 hover:-translate-y-0.5"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                    <Tag className="w-5 h-5" />
                  </div>
                  <select 
                    value={formData.category_id || ''}
                    onChange={e => setFormData(p => ({ ...p, category_id: e.target.value }))}
                    disabled={loadingCategories}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-2xl focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all outline-none shadow-sm font-bold text-slate-900 dark:text-white disabled:opacity-50 appearance-none"
                  >
                    <option value="" disabled>Seleccionar...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300">Ícono (Opcional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  placeholder="Ej. scissors"
                  value={formData.icon_name || ''}
                  onChange={e => setFormData(p => ({ ...p, icon_name: e.target.value }))}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-2xl focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all outline-none shadow-sm font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300">Descripción</label>
            <div className="relative">
              <div className="absolute top-4 left-0 pl-4 pointer-events-none text-slate-400 dark:text-zinc-500">
                <FileText className="w-5 h-5" />
              </div>
              <textarea 
                rows={3}
                placeholder="Detalles del servicio..."
                value={formData.description || ''}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-2xl focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all outline-none resize-none shadow-sm font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300">Duración (min)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <Clock className="w-5 h-5" />
                </div>
                <input 
                  type="number" 
                  required min="5" step="5"
                  value={formData.duration_minutes}
                  onChange={e => setFormData(p => ({ ...p, duration_minutes: Number(e.target.value) }))}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-2xl focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all outline-none shadow-sm font-black text-slate-900 dark:text-white text-lg"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300">Precio (S/)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <span className="font-bold">S/</span>
                </div>
                <input 
                  type="number" 
                  required min="0" step="0.01"
                  value={formData.price}
                  onChange={e => setFormData(p => ({ ...p, price: Number(e.target.value) }))}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-zinc-800/50 rounded-2xl focus:ring-2 focus:ring-black/5 dark:focus:ring-white/5 transition-all outline-none shadow-sm font-black text-slate-900 dark:text-white text-lg"
                />
              </div>
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
                'Guardar Servicio'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
