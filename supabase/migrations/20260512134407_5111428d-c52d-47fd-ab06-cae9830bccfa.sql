-- Create financial categories table
CREATE TABLE public.financial_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial subcategories table
CREATE TABLE public.financial_subcategories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES public.financial_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial transactions table
CREATE TABLE public.financial_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
    category_id UUID REFERENCES public.financial_categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES public.financial_subcategories(id) ON DELETE SET NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    supplier_client_name TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial_categories
CREATE POLICY "Users can view categories of their organization"
ON public.financial_categories FOR SELECT
USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert categories for their organization"
ON public.financial_categories FOR INSERT
WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update categories of their organization"
ON public.financial_categories FOR UPDATE
USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete categories of their organization"
ON public.financial_categories FOR DELETE
USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

-- RLS Policies for financial_subcategories (cascading through category)
CREATE POLICY "Users can view subcategories of their organization"
ON public.financial_subcategories FOR SELECT
USING (category_id IN (
    SELECT id FROM public.financial_categories WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
));

CREATE POLICY "Users can insert subcategories for their organization"
ON public.financial_subcategories FOR INSERT
WITH CHECK (category_id IN (
    SELECT id FROM public.financial_categories WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
));

CREATE POLICY "Users can update subcategories of their organization"
ON public.financial_subcategories FOR UPDATE
USING (category_id IN (
    SELECT id FROM public.financial_categories WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
));

CREATE POLICY "Users can delete subcategories of their organization"
ON public.financial_subcategories FOR DELETE
USING (category_id IN (
    SELECT id FROM public.financial_categories WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
));

-- RLS Policies for financial_transactions
CREATE POLICY "Users can view transactions of their organization"
ON public.financial_transactions FOR SELECT
USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert transactions for their organization"
ON public.financial_transactions FOR INSERT
WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update transactions of their organization"
ON public.financial_transactions FOR UPDATE
USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete transactions of their organization"
ON public.financial_transactions FOR DELETE
USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));

-- Function for updated_at
CREATE TRIGGER update_financial_categories_updated_at
BEFORE UPDATE ON public.financial_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_subcategories_updated_at
BEFORE UPDATE ON public.financial_subcategories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at
BEFORE UPDATE ON public.financial_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
