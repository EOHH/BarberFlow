-- ==========================================
-- BARBERFLOW SUPABASE SCHEMA
-- ==========================================

-- 0. Tenants (Barberías - Estructura SaaS Multi-Tenant)
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 0.5 Barbers (Barberos)
CREATE TABLE public.barbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. Services Table
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Availability Table
CREATE TABLE public.availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    barber_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    UNIQUE (tenant_id, barber_id, day_of_week, start_time, end_time)
);

-- 3. Appointments Table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Constraints & Indexes
-- Prevent double booking on the same date and time for active/pending appointments
CREATE UNIQUE INDEX idx_unique_active_appointment ON public.appointments (date, time) WHERE status IN ('pending', 'confirmed');

CREATE INDEX idx_appointments_date ON public.appointments (date);
CREATE INDEX idx_appointments_service_id ON public.appointments (service_id);
CREATE INDEX idx_availability_day ON public.availability (day_of_week);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- SERVICES: Anyone can read, only authenticated/admin can insert/update/delete
CREATE POLICY "Allow public read access to services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage services" ON public.services FOR ALL USING (auth.role() = 'authenticated');

-- AVAILABILITY: Anyone can read, only authenticated/admin can manage
CREATE POLICY "Allow public read access to availability" ON public.availability FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to manage availability" ON public.availability FOR ALL USING (auth.role() = 'authenticated');

-- APPOINTMENTS: 
-- Public can INSERT (create new bookings)
CREATE POLICY "Allow public to insert appointments" ON public.appointments FOR INSERT WITH CHECK (true);
-- Only authenticated users (admins) can view, update, delete appointments
CREATE POLICY "Allow authenticated users to manage appointments" ON public.appointments FOR ALL USING (auth.role() = 'authenticated');
