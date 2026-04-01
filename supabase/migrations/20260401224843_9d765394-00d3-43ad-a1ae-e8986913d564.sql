-- Adicionar campos para rastrear cliente
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS is_client boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS became_client_at timestamp with time zone;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_leads_is_client ON public.leads(is_client);
CREATE INDEX IF NOT EXISTS idx_leads_became_client_at ON public.leads(became_client_at);

-- Comentários para documentação
COMMENT ON COLUMN public.leads.is_client IS 'Indica se o lead se tornou cliente (tem pelo menos uma venda)';
COMMENT ON COLUMN public.leads.became_client_at IS 'Data e hora em que o lead se tornou cliente (primeira venda)';