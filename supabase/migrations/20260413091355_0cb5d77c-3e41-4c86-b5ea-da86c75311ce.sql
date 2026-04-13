ALTER TABLE public.sales 
ADD CONSTRAINT fk_sales_leads 
FOREIGN KEY (lead_id) 
REFERENCES public.leads(id) 
ON DELETE SET NULL;