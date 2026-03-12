-- Add 'vendedor' to org_role enum
ALTER TYPE public.org_role ADD VALUE IF NOT EXISTS 'vendedor';