-- Replace the organization members insert policy with a more restrictive one
DROP POLICY IF EXISTS "organization_members_insert_policy" ON public.organization_members;

CREATE POLICY "organization_members_insert_policy" ON public.organization_members
FOR INSERT TO authenticated
WITH CHECK (
  (
    -- 1. The actor must be a verified superadmin
    (public.is_superadmin(auth.uid()) AND public.is_user_verified(auth.uid()))
    OR
    (
      -- 2. The actor must be a verified member of the TARGET organization
      public.is_user_verified(auth.uid())
      AND
      (
        -- Actor is the owner of the organization (from the organizations table)
        EXISTS (
          SELECT 1 FROM public.organizations 
          WHERE id = organization_id AND owner_id = auth.uid()
        )
        OR
        (
          -- Actor is an owner of the organization (from members table)
          public.get_org_role(auth.uid(), organization_id) = 'owner'::org_role
          AND (auth.uid() <> user_id)
        )
        OR
        (
          -- Actor is an admin and the new member is NOT an owner
          public.get_org_role(auth.uid(), organization_id) = 'admin'::org_role
          AND (auth.uid() <> user_id)
          AND (role <> 'owner'::org_role)
        )
      )
    )
  )
  AND
  -- 3. The member being added must have a profile and be verified
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id
  )
  AND public.is_user_verified(user_id)
);
