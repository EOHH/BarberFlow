-- phase24_realtime_all.sql
-- Habilita Supabase Realtime para todas las tablas públicas necesarias

-- Añadir tablas a la publicación "supabase_realtime" si no existen
-- (Ignorará las que ya estén añadidas como appointments si se maneja correctamente o simplemente alteramos la publicación)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'tenants'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tenants;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'services'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'barbers'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.barbers;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'availability'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.availability;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'gallery_images'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.gallery_images;
    END IF;
    
    -- Appointments was already added in phase19, but just in case:
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'appointments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
    END IF;
END $$;
