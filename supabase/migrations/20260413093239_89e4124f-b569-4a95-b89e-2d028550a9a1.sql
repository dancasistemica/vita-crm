-- Drop the existing permissive policy
DROP POLICY IF EXISTS "organization_members_insert_policy" ON "public"."organization_members";

-- Create a more restrictive INSERT policy
CREATE POLICY "organization_members_insert_policy"
ON "public"."organization_members"
FOR INSERT
TO authenticated
WITH CHECK (
  -- 1. Users who are the OWNER of the organization (defined in the organizations table)
  -- can add anyone to that organization.
  (EXISTS (
    SELECT 1 FROM public.organizations 
    WHERE id = organization_id AND owner_id = auth.uid()
  ))
  OR
  -- 2. Users who are already an admin or owner of the organization
  -- can add OTHER users to it. They cannot add themselves to a new org
  -- this way because they wouldn't be an admin yet.
  (
    (public.get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]))
    AND 
    (auth.uid() <> user_id)
  )
  OR
  -- 3. Superadmins have full access
  public.is_superadmin(auth.uid())
);
