
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cep text,
ADD COLUMN IF NOT EXISTS street text,
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text;

CREATE INDEX IF NOT EXISTS idx_profiles_cep ON public.profiles(cep);
