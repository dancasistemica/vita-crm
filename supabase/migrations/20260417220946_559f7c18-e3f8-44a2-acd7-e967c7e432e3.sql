-- Fix recursive policy on superadmin_roles
DROP POLICY IF EXISTS "Superadmins can view superadmin_roles" ON public.superadmin_roles;
CREATE POLICY "Anyone can view their own superadmin role" 
ON public.superadmin_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can view all superadmin roles" 
ON public.superadmin_roles 
FOR SELECT 
USING (is_superadmin(auth.uid()));

-- Ensure organizations policy is robust
DROP POLICY IF EXISTS "Superadmins can view all orgs" ON public.organizations;
CREATE POLICY "Superadmins can view all orgs" 
ON public.organizations 
FOR SELECT 
TO authenticated
USING (is_superadmin(auth.uid()));
