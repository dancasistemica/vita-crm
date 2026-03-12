
-- Superadmin can view all leads
CREATE POLICY "Superadmins can view all leads"
ON public.leads FOR SELECT
TO authenticated
USING (is_superadmin(auth.uid()));

-- Superadmin can view all sales
CREATE POLICY "Superadmins can view all sales"
ON public.sales FOR SELECT
TO authenticated
USING (is_superadmin(auth.uid()));

-- Superadmin can view all products
CREATE POLICY "Superadmins can view all products"
ON public.products FOR SELECT
TO authenticated
USING (is_superadmin(auth.uid()));

-- Superadmin can view all pipeline_stages
CREATE POLICY "Superadmins can view all pipeline_stages"
ON public.pipeline_stages FOR SELECT
TO authenticated
USING (is_superadmin(auth.uid()));

-- Superadmin can view all lead_origins
CREATE POLICY "Superadmins can view all lead_origins"
ON public.lead_origins FOR SELECT
TO authenticated
USING (is_superadmin(auth.uid()));
