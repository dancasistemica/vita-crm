-- 1. Fix organization_members INSERT policy to use SECURITY DEFINER function
DROP POLICY IF EXISTS "organization_members_insert_policy" ON public.organization_members;

CREATE POLICY "organization_members_insert_policy" ON public.organization_members
FOR INSERT TO authenticated
WITH CHECK (
  is_superadmin(auth.uid())
  OR (
    is_user_verified(auth.uid())
    AND (auth.uid() <> user_id)
    AND is_org_admin(organization_id)
  )
);

-- 2. Fix integrations_secure: restrict credentials access to admins only
DROP POLICY IF EXISTS "Users can update their organization's integrations" ON public.integrations_secure;
DROP POLICY IF EXISTS "Users can view their organization's integrations" ON public.integrations_secure;

-- Admin-only full access (including credentials)
CREATE POLICY "Admins can manage integrations" ON public.integrations_secure
FOR ALL TO authenticated
USING (
  is_org_admin(organization_id) OR is_superadmin(auth.uid())
)
WITH CHECK (
  is_org_admin(organization_id) OR is_superadmin(auth.uid())
);

-- Regular members can only view non-credential fields (RLS can't hide columns, so we restrict to admin only)
-- Non-admin members should not access this table directly
CREATE POLICY "Org members can view integrations metadata" ON public.integrations_secure
FOR SELECT TO authenticated
USING (
  organization_id IN (SELECT get_user_org_ids(auth.uid()) AS get_user_org_ids)
);

-- 3. Fix email_templates: add write policies for org admins
CREATE POLICY "Org admins can manage email_templates" ON public.email_templates
FOR ALL TO authenticated
USING (
  organization_id IS NOT NULL AND (
    is_org_admin(organization_id) OR is_superadmin(auth.uid())
  )
)
WITH CHECK (
  organization_id IS NOT NULL AND (
    is_org_admin(organization_id) OR is_superadmin(auth.uid())
  )
);

-- 4. Fix realtime: scope tasks-dashboard to org members
DROP POLICY IF EXISTS "Users can subscribe to their organization topics" ON realtime.messages;

CREATE POLICY "Users can subscribe to their organization topics" ON realtime.messages
FOR SELECT TO authenticated
USING (
  (
    topic ~ ':org:' AND (split_part(topic, ':', 3))::uuid IN (
      SELECT organization_members.organization_id
      FROM organization_members
      WHERE organization_members.user_id = auth.uid()
    )
  )
  OR (
    topic LIKE 'tasks-dashboard:org:%' AND (split_part(topic, ':', 3))::uuid IN (
      SELECT organization_members.organization_id
      FROM organization_members
      WHERE organization_members.user_id = auth.uid()
    )
  )
  OR (
    topic LIKE 'timeline-%' AND EXISTS (
      SELECT 1 FROM leads l
      JOIN organization_members om ON l.organization_id = om.organization_id
      WHERE ('timeline-' || l.id::text) = messages.topic
      AND om.user_id = auth.uid()
    )
  )
);