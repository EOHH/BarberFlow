import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../infrastructure/supabase/client';
import type { GalleryImage } from '../../types';

export function usePublicGallery(slug?: string) {
  const { data: galleryImages = [], isLoading } = useQuery({
    queryKey: ['public-gallery', slug],
    queryFn: async () => {
      if (!slug) return [];
      
      // We first need the tenant ID to fetch images
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('domain', slug)
        .single();
        
      if (tenantError || !tenantData) {
        console.error('Error fetching tenant for gallery:', tenantError);
        return [];
      }

      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('tenant_id', tenantData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching gallery:', error);
        throw error;
      }
      return data as GalleryImage[];
    },
    enabled: !!slug,
  });

  return { galleryImages, isLoading };
}
