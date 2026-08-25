-- Migration: phase21_tenant_location
-- Add address and business_hours to tenants table

ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS business_hours TEXT;
