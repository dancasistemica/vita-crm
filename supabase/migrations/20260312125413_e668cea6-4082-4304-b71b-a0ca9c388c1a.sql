
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS rua TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS municipio TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS estado TEXT;

CREATE INDEX IF NOT EXISTS idx_organizations_cnpj ON public.organizations(cnpj);
