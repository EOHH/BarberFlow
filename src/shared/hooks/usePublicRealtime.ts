import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../infrastructure/supabase/client';

export function usePublicRealtime(tenantId: string | undefined, slug: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tenantId || !slug) return;

    const invalidateData = () => {
      queryClient.invalidateQueries({ queryKey: ['public-tenant', slug] });
      queryClient.invalidateQueries({ queryKey: ['public-gallery', slug] });
      queryClient.invalidateQueries({ queryKey: ['public-slots'] });
    };

    // Create a single channel for all public updates for this tenant
    const channel = supabase.channel(`public-updates-${tenantId}`)
      // Escuchar cambios en el tenant (dirección, colores, logo)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tenants',
        filter: `id=eq.${tenantId}`,
      }, invalidateData)
      
      // Escuchar cambios en servicios (precios, descripciones)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'services',
        filter: `tenant_id=eq.${tenantId}`,
      }, invalidateData)
      
      // Escuchar cambios en barberos (nuevos, inactivados)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'barbers',
        filter: `tenant_id=eq.${tenantId}`,
      }, invalidateData)
      
      // Escuchar cambios en disponibilidad
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'availability',
        filter: `tenant_id=eq.${tenantId}`,
      }, invalidateData)
      
      // Escuchar nuevas reservas (para actualizar disponibilidad en tiempo real si impacta UI)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `tenant_id=eq.${tenantId}`,
      }, invalidateData)
      
      // Escuchar nueva fotos en la galería
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'gallery_images',
        filter: `tenant_id=eq.${tenantId}`,
      }, invalidateData)
      
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, slug, queryClient]);
}
