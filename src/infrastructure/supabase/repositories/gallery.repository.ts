import { supabase } from '../client';
import type { GalleryImage } from '../../../types';
import imageCompression from 'browser-image-compression';

export const galleryRepository = {
  async getGalleryImages(tenantId: string): Promise<GalleryImage[]> {
    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getRecentGalleryImages(tenantId: string, limit: number = 4): Promise<GalleryImage[]> {
    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async uploadImage(tenantId: string, file: File, caption?: string): Promise<GalleryImage> {
    // 1. Comprimir la imagen antes de subirla
    const options = {
      maxSizeMB: 5,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };
    
    let compressedFile = file;
    try {
      compressedFile = await imageCompression(file, options);
    } catch (error) {
      console.warn("No se pudo comprimir la imagen, se subirá original.", error);
    }

    // 2. Subir a Supabase Storage
    const fileExt = compressedFile.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${tenantId}/gallery/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('brand_assets')
      .upload(filePath, compressedFile);

    if (uploadError) throw uploadError;

    // 3. Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('brand_assets')
      .getPublicUrl(filePath);

    // 4. Guardar registro en la tabla gallery_images
    const { data, error: insertError } = await supabase
      .from('gallery_images')
      .insert([
        {
          tenant_id: tenantId,
          image_url: urlData.publicUrl,
          caption: caption || null
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;
    return data;
  },

  async deleteImage(imageId: string, imageUrl: string): Promise<void> {
    // 1. Eliminar de la base de datos
    const { error: dbError } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', imageId);

    if (dbError) throw dbError;

    // 2. Extraer el path del archivo desde la URL para borrar de storage
    try {
      const urlObj = new URL(imageUrl);
      const pathParts = urlObj.pathname.split('/brand_assets/');
      if (pathParts.length === 2) {
        const filePath = pathParts[1];
        await supabase.storage.from('brand_assets').remove([filePath]);
      }
    } catch (e) {
      console.error("Error intentando eliminar el archivo del storage:", e);
    }
  }
};
