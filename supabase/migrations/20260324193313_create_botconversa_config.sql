-- Create botconversa_config table
CREATE TABLE botconversa_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_botconversa_config_organization_id ON botconversa_config(organization_id);

-- Enable RLS
ALTER TABLE botconversa_config ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only organization members can view their own config
CREATE POLICY botconversa_config_select ON botconversa_config
  FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE id = auth.uid()::uuid OR owner_id = auth.uid()
    )
  );

-- RLS Policy: Only organization admin/superadmin can update
CREATE POLICY botconversa_config_update ON botconversa_config
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- RLS Policy: Only organization admin/superadmin can insert
CREATE POLICY botconversa_config_insert ON botconversa_config
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );
