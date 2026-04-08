-- Add engagement columns to clients
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS engagement_level TEXT DEFAULT 'BAIXO',
ADD COLUMN IF NOT EXISTS last_attendance_date TIMESTAMP WITH TIME ZONE;

-- Create client_products table
CREATE TABLE IF NOT EXISTS public.client_products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    payment_status TEXT NOT NULL DEFAULT 'INATIVO',
    payment_method TEXT,
    plan_type TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create class_attendance table
CREATE TABLE IF NOT EXISTS public.class_attendance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    class_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    attendance_type TEXT NOT NULL DEFAULT 'PRESENÇA', -- PRESENÇA, FALTA, JUSTIFICADA
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for client_products
CREATE POLICY "Users can view their own organization's client_products"
ON public.client_products
FOR SELECT
USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert their own organization's client_products"
ON public.client_products
FOR INSERT
WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their own organization's client_products"
ON public.client_products
FOR UPDATE
USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete their own organization's client_products"
ON public.client_products
FOR DELETE
USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

-- Create RLS policies for class_attendance
CREATE POLICY "Users can view their own organization's class_attendance"
ON public.class_attendance
FOR SELECT
USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert their own organization's class_attendance"
ON public.class_attendance
FOR INSERT
WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their own organization's class_attendance"
ON public.class_attendance
FOR UPDATE
USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete their own organization's class_attendance"
ON public.class_attendance
FOR DELETE
USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

-- Create function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop if exists and create trigger
DROP TRIGGER IF EXISTS update_client_products_updated_at ON public.client_products;
CREATE TRIGGER update_client_products_updated_at
BEFORE UPDATE ON public.client_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
