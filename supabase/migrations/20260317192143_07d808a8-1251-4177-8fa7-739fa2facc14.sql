
-- Drop the problematic policies that reference profiles table (causing recursion)
DROP POLICY IF EXISTS "superadmin_delete_organization_members" ON organization_members;
DROP POLICY IF EXISTS "superadmin_insert_organization_members" ON organization_members;
DROP POLICY IF EXISTS "superadmin_update_organization_members" ON organization_members;

-- Recreate using is_superadmin() security definer function (no RLS bypass needed)
CREATE POLICY "superadmin_delete_organization_members" ON organization_members
  FOR DELETE TO authenticated
  USING (is_superadmin(auth.uid()));

CREATE POLICY "superadmin_insert_organization_members" ON organization_members
  FOR INSERT TO authenticated
  WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "superadmin_update_organization_members" ON organization_members
  FOR UPDATE TO authenticated
  USING (is_superadmin(auth.uid()));
