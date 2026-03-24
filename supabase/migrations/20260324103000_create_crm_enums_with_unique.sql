-- CRM enum tables uniqueness (case-insensitive) per organization
CREATE UNIQUE INDEX IF NOT EXISTS uniq_lead_origins_org_name
  ON public.lead_origins (organization_id, lower(name));

CREATE UNIQUE INDEX IF NOT EXISTS uniq_interest_levels_org_value
  ON public.interest_levels (organization_id, lower(value));

CREATE UNIQUE INDEX IF NOT EXISTS uniq_pipeline_stages_org_name
  ON public.pipeline_stages (organization_id, lower(name));

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_lead_origins_org_id ON public.lead_origins(organization_id);
CREATE INDEX IF NOT EXISTS idx_interest_levels_org_id ON public.interest_levels(organization_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_org_id ON public.pipeline_stages(organization_id);
