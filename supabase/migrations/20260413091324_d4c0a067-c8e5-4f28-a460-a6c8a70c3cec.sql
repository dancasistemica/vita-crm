-- Habilitar RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas (incluindo as que usam get_user_org_ids)
DROP POLICY IF EXISTS "sales_select_policy" ON public.sales;
DROP POLICY IF EXISTS "sales_insert_policy" ON public.sales;
DROP POLICY IF EXISTS "sales_update_policy" ON public.sales;
DROP POLICY IF EXISTS "sales_delete_policy" ON public.sales;
DROP POLICY IF EXISTS "Superadmins can manage all sales" ON public.sales;
DROP POLICY IF EXISTS "Superadmins can view all sales" ON public.sales;

-- Criar policy para SELECT
CREATE POLICY "sales_select_policy"
ON public.sales FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
  OR is_superadmin(auth.uid())
);

-- Criar policy para INSERT
CREATE POLICY "sales_insert_policy"
ON public.sales FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
  OR is_superadmin(auth.uid())
);

-- Criar policy para UPDATE
CREATE POLICY "sales_update_policy"
ON public.sales FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
  OR is_superadmin(auth.uid())
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
  OR is_superadmin(auth.uid())
);

-- Criar policy para DELETE
CREATE POLICY "sales_delete_policy"
ON public.sales FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
  OR is_superadmin(auth.uid())
);