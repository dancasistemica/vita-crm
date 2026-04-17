-- Add unique constraint to client_products to allow upsert by (client_id, product_id)
ALTER TABLE public.client_products 
ADD CONSTRAINT client_products_client_id_product_id_key UNIQUE (client_id, product_id);
