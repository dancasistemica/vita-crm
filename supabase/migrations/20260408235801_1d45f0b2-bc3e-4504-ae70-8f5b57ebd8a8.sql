ALTER TABLE public.client_products 
ADD COLUMN IF NOT EXISTS risk_of_churn BOOLEAN DEFAULT FALSE;
