-- Fix vulnerability where any organization owner/admin could insert themselves into any other organization
DROP POLICY IF EXISTS "Owners/admins can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "superadmin_insert_organization_members" ON public.organization_members;

CREATE POLICY "organization_members_insert_policy" ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    -- User is an owner/admin of the target organization
    (public.get_org_role(auth.uid(), organization_id) IN ('owner', 'admin'))
    OR
    -- User is the owner_id of the target organization in the organizations table
    EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE id = organization_id AND owner_id = auth.uid()
    )
    OR
    -- User is a superadmin
    public.is_superadmin(auth.uid())
  );
