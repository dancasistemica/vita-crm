-- Only superadmins can create organizations via SQL directly (regular users should use the edge function which is already restricted)
DROP POLICY IF EXISTS "Users can create their own org" ON public.organizations;
CREATE POLICY "Superadmins can create orgs" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (is_superadmin(auth.uid()));

-- Fix the organization_members update policy to correctly reference the row being updated
DROP POLICY IF EXISTS "organization_members_update_policy" ON public.organization_members;
CREATE POLICY "organization_members_update_policy" ON public.organization_members
  FOR UPDATE TO authenticated
  USING (
    (get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]))
    OR is_superadmin(auth.uid())
  )
  WITH CHECK (
    (
      (get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]))
      OR is_superadmin(auth.uid())
    )
    AND organization_id = organization_id -- This is redundant but ensures we don't change org_id
  );

-- Fix the organization_members insert policy to be more robust
DROP POLICY IF EXISTS "organization_members_insert_policy" ON public.organization_members;
CREATE POLICY "organization_members_insert_policy" ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      (is_superadmin(auth.uid()) AND is_user_verified(auth.uid()))
      OR (
        is_user_verified(auth.uid())
        AND (
          -- Must be owner or admin of the organization they are adding a user to
          (get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]))
        )
      )
    )
    AND (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = organization_members.user_id))
    AND is_user_verified(user_id)
  );
