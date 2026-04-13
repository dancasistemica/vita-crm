-- Redefine is_org_admin to be more robust and SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
 AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
END;
$function$;

-- Drop and recreate the insert policy to be more explicit
DROP POLICY IF EXISTS "organization_members_insert_policy" ON "public"."organization_members";

CREATE POLICY "organization_members_insert_policy" ON "public"."organization_members"
FOR INSERT 
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

-- Ensure RLS is enabled (it should be already, but being explicit is good)
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
