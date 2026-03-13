
-- Remove broken public-role policies on leads that cause data leakage
-- These policies reference leads.organization_id from profiles (which doesn't have that column),
-- causing the condition to always evaluate to TRUE

DROP POLICY IF EXISTS "Users can view leads from their organization or SuperAdmin" ON public.leads;
DROP POLICY IF EXISTS "Users can insert leads in their organization or SuperAdmin" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads in their organization or SuperAdmin" ON public.leads;
DROP POLICY IF EXISTS "Users can delete leads in their organization or SuperAdmin" ON public.leads;

-- Remove broken public-role policy on sales
DROP POLICY IF EXISTS "Users can view sales from their organization or SuperAdmin" ON public.sales;
