-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "organization_members_insert_policy" ON public.organization_members;
DROP POLICY IF EXISTS "organization_members_update_policy" ON public.organization_members;
DROP POLICY IF EXISTS "organization_members_delete_policy" ON public.organization_members;
DROP POLICY IF EXISTS "superadmin_update_organization_members" ON public.organization_members;
DROP POLICY IF EXISTS "Owners can delete members" ON public.organization_members;

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
        -- Actor is the owner of the organization
        EXISTS (
          SELECT 1 FROM public.organizations 
          WHERE id = organization_id AND owner_id = auth.uid()
        )
        OR
        -- Actor is an owner of the organization
        (public.get_org_role(auth.uid(), organization_id) = 'owner'::org_role AND auth.uid() <> user_id)
        OR
        -- Actor is an admin and the new member is NOT an owner
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
  -- Prevent changing organization_id or user_id in existing records
  AND (organization_id = (SELECT m.organization_id FROM public.organization_members m WHERE m.id = id))
  AND (user_id = (SELECT m.user_id FROM public.organization_members m WHERE m.id = id))
);

-- Improved DELETE policy for organization_members
CREATE POLICY "organization_members_delete_policy" ON public.organization_members
FOR DELETE TO authenticated
USING (
  (
    (public.get_org_role(auth.uid(), organization_id) = 'owner'::org_role AND auth.uid() <> user_id)
    OR
    (public.get_org_role(auth.uid(), organization_id) = 'admin'::org_role AND auth.uid() <> user_id AND role <> 'owner'::org_role)
    OR
    public.is_superadmin(auth.uid())
  )
);
