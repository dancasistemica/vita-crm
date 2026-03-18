
CREATE TABLE IF NOT EXISTS pipeline_stage_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pipeline_stage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_read_stage_history"
ON pipeline_stage_history FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT get_user_org_ids(auth.uid())
  )
);

CREATE POLICY "org_members_insert_stage_history"
ON pipeline_stage_history FOR INSERT TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT get_user_org_ids(auth.uid())
  )
);

CREATE POLICY "superadmins_read_stage_history"
ON pipeline_stage_history FOR SELECT TO authenticated
USING (is_superadmin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_stage_history_lead_id
ON pipeline_stage_history(lead_id);

CREATE INDEX IF NOT EXISTS idx_stage_history_changed_at
ON pipeline_stage_history(changed_at DESC);
