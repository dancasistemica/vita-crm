-- Add SellFlux tracking columns to existing tables
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS sellflux_customer_id TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sellflux_product_id TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS sellflux_order_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS sellflux_id TEXT;

-- Create indexes for the new columns to optimize lookups during synchronization
CREATE INDEX IF NOT EXISTS idx_leads_sellflux_customer_id ON public.leads(sellflux_customer_id);
CREATE INDEX IF NOT EXISTS idx_products_sellflux_product_id ON public.products(sellflux_product_id);
CREATE INDEX IF NOT EXISTS idx_sales_sellflux_order_id ON public.sales(sellflux_order_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_sellflux_id ON public.subscriptions(sellflux_id);

-- Add unique constraints to prevent duplicate synchronization from the same SellFlux entity within an organization
-- (Note: Using organization_id + sellflux_id to allow same sellflux ID across different organizations if needed)
-- First check if we can add unique constraints (might fail if data already exists, but it's a new feature)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_organization_sellflux_unique') THEN
        ALTER TABLE public.leads ADD CONSTRAINT leads_organization_sellflux_unique UNIQUE (organization_id, sellflux_customer_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_organization_sellflux_unique') THEN
        ALTER TABLE public.products ADD CONSTRAINT products_organization_sellflux_unique UNIQUE (organization_id, sellflux_product_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_organization_sellflux_unique') THEN
        ALTER TABLE public.sales ADD CONSTRAINT sales_organization_sellflux_unique UNIQUE (organization_id, sellflux_order_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_organization_sellflux_unique') THEN
        ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_organization_sellflux_unique UNIQUE (organization_id, sellflux_id);
    END IF;
END $$;
