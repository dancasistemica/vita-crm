
ALTER TABLE public.lead_origins ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
ALTER TABLE public.interest_levels ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
