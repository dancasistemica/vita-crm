-- Restrict lead deletion to admin/owner
DROP POLICY IF EXISTS "Org members can delete leads" ON public.leads;

CREATE POLICY "Admin/Owner can delete leads" ON public.leads
  FOR DELETE TO authenticated
  USING (public.get_org_role(auth.uid(), organization_id) IN ('owner', 'admin'));
