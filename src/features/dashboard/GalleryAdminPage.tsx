import { useState, useEffect } from 'react';
import { galleryRepository } from '../../infrastructure/supabase/repositories/gallery.repository';
import { useTenantSettings } from '../../shared/hooks/useTenantSettings';
import type { GalleryImage } from '../../types';
import { Trash2, UploadCloud, Image as ImageIcon, Loader2 } from 'lucide-react';
import { notifications as toast } from '../../shared/lib/notifications';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';

export function GalleryAdminPage() {
  const { tenant, isLoading: isLoadingTenant } = useTenantSettings();
  const tenantId = tenant?.id;
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imageToDelete, setImageToDelete] = useState<GalleryImage | null>(null);

  useEffect(() => {
    if (tenantId) {
      loadImages();
    }
  }, [tenantId]);

  const loadImages = async () => {
    if (!tenantId) return;
    setIsLoadingGallery(true);
    try {
      const data = await galleryRepository.getGalleryImages(tenantId);
      setImages(data);
    } catch (error) {
      console.error(error);
      toast.error('No pudimos cargar la galería', {
        description: 'Revisa tu conexión e inténtalo nuevamente.',
      });
    } finally {
      setIsLoadingGallery(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !tenantId) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Selecciona una imagen válida', {
        description: 'El archivo elegido debe ser una imagen compatible.',
      });
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Comprimiendo y subiendo imagen...');

    try {
      const newImage = await galleryRepository.uploadImage(tenantId, file);
      setImages(prev => [newImage, ...prev]);
      toast.update(toastId, 'success', 'Imagen subida correctamente');
    } catch (error) {
      console.error(error);
      toast.update(toastId, 'error', 'No pudimos subir la imagen', {
        description: 'Verifica el archivo y vuelve a intentarlo.',
      });
    } finally {
      setIsUploading(false);
      // Reset input
      if (event.target) event.target.value = '';
    }
  };

  const handleDelete = async (image: GalleryImage) => {
    setDeletingId(image.id);
    try {
      await galleryRepository.deleteImage(image.id, image.image_url);
      setImages(prev => prev.filter(img => img.id !== image.id));
      setImageToDelete(null);
      toast.success('Imagen eliminada');
    } catch (error) {
      console.error(error);
      toast.error('No pudimos eliminar la imagen', {
        description: 'La imagen permanece en la galería.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoadingTenant || isLoadingGallery) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Galería de Trabajos</h1>
          <p className="text-zinc-400">Sube fotos de tus mejores cortes para mostrarlos a tus clientes. (Máx 5MB recomendado)</p>
        </div>
        
        <div>
          <label 
            htmlFor="gallery-upload"
            className={`flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-lg font-medium cursor-pointer hover:bg-zinc-200 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
            Subir Nueva Foto
          </label>
          <input 
            type="file" 
            id="gallery-upload" 
            className="hidden" 
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </div>
      </div>

      {images.length === 0 ? (
        <div className="bg-[#111] border border-zinc-800 rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Tu galería está vacía</h3>
          <p className="text-zinc-400 max-w-md mx-auto">
            Sube tu primera foto para que tus clientes puedan ver la calidad de tus cortes y servicios.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map(img => (
            <div key={img.id} className="group relative aspect-[4/5] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
              <img 
                src={img.image_url} 
                alt="Galería" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* Overlay with Delete Button */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => setImageToDelete(img)}
                  disabled={deletingId === img.id}
                  className="bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white p-3 rounded-full transition-colors"
                  title="Eliminar imagen"
                >
                  {deletingId === img.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={imageToDelete !== null}
        title="Eliminar imagen"
        description="Esta imagen desaparecerá de la galería pública y la acción no se puede deshacer."
        confirmLabel="Eliminar imagen"
        isPending={imageToDelete ? deletingId === imageToDelete.id : false}
        onCancel={() => setImageToDelete(null)}
        onConfirm={() => {
          if (imageToDelete) void handleDelete(imageToDelete);
        }}
      />
    </div>
  );
}
