CREATE POLICY "Superadmins can delete orgs"
ON public.organizations FOR DELETE TO authenticated
USING (is_superadmin(auth.uid()));