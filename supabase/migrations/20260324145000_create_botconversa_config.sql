CREATE TABLE IF NOT EXISTS public.botconversa_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  api_key text NOT NULL,
  is_active boolean DEFAULT true,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.botconversa_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_manage_botconversa_config"
ON botconversa_config FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = botconversa_config.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = botconversa_config.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'admin'
  )
);

CREATE INDEX idx_botconversa_config_org_id ON public.botconversa_config(organization_id);
