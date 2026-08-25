-- Migration: phase20_gallery
-- Create table for gallery images

CREATE TABLE IF NOT EXISTS public.gallery_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Policies for gallery_images
-- Anyone can read gallery images
CREATE POLICY "gallery_images_read_policy" ON public.gallery_images
    FOR SELECT USING (true);

-- Only authenticated admins can insert/update/delete their own tenant's images
CREATE POLICY "gallery_images_insert_policy" ON public.gallery_images
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' 
        AND tenant_id = (SELECT tu.tenant_id FROM public.tenant_users tu WHERE tu.user_id = auth.uid() LIMIT 1)
    );

CREATE POLICY "gallery_images_delete_policy" ON public.gallery_images
    FOR DELETE
    USING (
        auth.role() = 'authenticated' 
        AND tenant_id = (SELECT tu.tenant_id FROM public.tenant_users tu WHERE tu.user_id = auth.uid() LIMIT 1)
    );

CREATE POLICY "gallery_images_update_policy" ON public.gallery_images
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' 
        AND tenant_id = (SELECT tu.tenant_id FROM public.tenant_users tu WHERE tu.user_id = auth.uid() LIMIT 1)
    );
