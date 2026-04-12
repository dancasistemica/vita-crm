-- 1. Update leads who have sales/subscriptions but are not marked as clients
UPDATE public.leads
SET is_client = true,
    became_client_at = COALESCE(became_client_at, created_at),
    updated_at = now()
WHERE id IN (
    SELECT lead_id FROM public.sales WHERE lead_id IS NOT NULL
    UNION
    SELECT client_id FROM public.subscriptions WHERE client_id IS NOT NULL
) AND (is_client = false OR is_client IS NULL);

-- 2. Populate 'clients' table from ALL leads where is_client is true
INSERT INTO public.clients (id, organization_id, name, phone, email, created_at, updated_at)
SELECT id, organization_id, name, phone, email, created_at, updated_at
FROM public.leads
WHERE is_client = true
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    updated_at = EXCLUDED.updated_at;

-- 3. Populate 'client_products' from 'sales' (using leads that have sales)
INSERT INTO public.client_products (organization_id, client_id, product_id, payment_status, payment_method, start_date)
SELECT DISTINCT 
    s.organization_id, 
    s.lead_id as client_id, 
    COALESCE(s.product_id, (SELECT id FROM products p WHERE p.organization_id = s.organization_id LIMIT 1)) as product_id,
    CASE WHEN s.status = 'pago' THEN 'ATIVO' ELSE 'PENDENTE' END as payment_status,
    s.payment_method,
    s.sale_date as start_date
FROM public.sales s
WHERE s.lead_id IS NOT NULL 
  AND EXISTS (SELECT 1 FROM public.clients c WHERE c.id = s.lead_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.client_products cp 
    WHERE cp.client_id = s.lead_id 
      AND cp.product_id = COALESCE(s.product_id, (SELECT id FROM products p WHERE p.organization_id = s.organization_id LIMIT 1))
  )
ON CONFLICT DO NOTHING;

-- 4. Populate 'client_products' from 'subscriptions'
INSERT INTO public.client_products (organization_id, client_id, product_id, payment_status, start_date, end_date)
SELECT DISTINCT 
    sub.organization_id, 
    sub.client_id, 
    (SELECT product_id FROM product_sales_stages pss WHERE pss.id = sub.sales_stage_id LIMIT 1) as product_id,
    CASE WHEN sub.status = 'ativa' THEN 'ATIVO' ELSE 'INATIVO' END as payment_status,
    sub.start_date,
    sub.end_date
FROM public.subscriptions sub
WHERE sub.client_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.clients c WHERE c.id = sub.client_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.client_products cp 
    WHERE cp.client_id = sub.client_id 
      AND cp.product_id = (SELECT product_id FROM product_sales_stages pss WHERE pss.id = sub.sales_stage_id LIMIT 1)
  )
ON CONFLICT DO NOTHING;