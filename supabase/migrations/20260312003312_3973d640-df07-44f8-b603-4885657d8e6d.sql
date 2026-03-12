
-- Add extra columns to organizations for contact info
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS description text;
