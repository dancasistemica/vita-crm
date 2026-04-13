-- Drop existing policies on organization_members to re-create them correctly
DROP POLICY IF EXISTS "organization_members_insert_policy" ON public.organization_members;
DROP POLICY IF EXISTS "Owners/admins can update members" ON public.organization_members;
DROP POLICY IF EXISTS "superadmin_update_organization_members" ON public.organization_members;

-- Improved INSERT policy for organization_members
CREATE POLICY "organization_members_insert_policy" ON public.organization_members
FOR INSERT TO authenticated
WITH CHECK (
  (
    -- 1. Superadmin check
    (public.is_superadmin(auth.uid()) AND public.is_user_verified(auth.uid()))
    OR
    (
      -- 2. Target organization membership check
      public.is_user_verified(auth.uid())
      AND (
        -- Actor is the direct owner of the organization
        EXISTS (
          SELECT 1 FROM public.organizations 
          WHERE id = organization_id AND owner_id = auth.uid()
        )
        OR
        -- Actor is already an owner of the organization in the members table
        (public.get_org_role(auth.uid(), organization_id) = 'owner'::org_role AND auth.uid() <> user_id)
        OR
        -- Actor is already an admin and not adding an owner
        (public.get_org_role(auth.uid(), organization_id) = 'admin'::org_role AND auth.uid() <> user_id AND role <> 'owner'::org_role)
      )
    )
  )
  AND 
  -- 3. Verify target profile exists and is verified
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id)
  AND public.is_user_verified(user_id)
);

-- Improved UPDATE policy for organization_members
CREATE POLICY "organization_members_update_policy" ON public.organization_members
FOR UPDATE TO authenticated
USING (
  (public.get_org_role(auth.uid(), organization_id) IN ('owner'::org_role, 'admin'::org_role))
  OR public.is_superadmin(auth.uid())
)
WITH CHECK (
  (
    (public.get_org_role(auth.uid(), organization_id) IN ('owner'::org_role, 'admin'::org_role))
    OR public.is_superadmin(auth.uid())
  )
  -- Prevent changing the organization_id of a membership record
  AND (organization_id = (SELECT m.organization_id FROM public.organization_members m WHERE m.id = organization_members.id))
);

-- Ensure superadmin_update_organization_members is properly defined if needed
-- (The update_policy already covers superadmin, but we can keep it separate if preferred)
CREATE POLICY "superadmin_update_organization_members" ON public.organization_members
FOR UPDATE TO authenticated
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));
