
CREATE TABLE IF NOT EXISTS dashboard_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, card_id)
);

ALTER TABLE dashboard_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_read_dashboard_settings"
ON dashboard_settings FOR SELECT TO authenticated
USING (
  organization_id IN (SELECT get_user_org_ids(auth.uid()))
  OR is_superadmin(auth.uid())
);

CREATE POLICY "org_admin_write_dashboard_settings"
ON dashboard_settings FOR ALL TO authenticated
USING (
  is_superadmin(auth.uid())
  OR get_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
)
WITH CHECK (
  is_superadmin(auth.uid())
  OR get_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
);
