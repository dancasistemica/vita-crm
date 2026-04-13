-- Ensure the insert policy only applies to authenticated users
DROP POLICY IF EXISTS "organization_members_insert_policy" ON "public"."organization_members";

CREATE POLICY "organization_members_insert_policy" ON "public"."organization_members"
FOR INSERT 
TO authenticated
WITH CHECK (
  is_superadmin(auth.uid()) OR (
    is_user_verified(auth.uid()) AND 
    (auth.uid() <> user_id) AND
    EXISTS (
      SELECT 1 FROM public.organization_members AS existing_admin
      WHERE existing_admin.organization_id = organization_members.organization_id
      AND existing_admin.user_id = auth.uid()
      AND existing_admin.role IN ('owner', 'admin')
    )
  )
);
