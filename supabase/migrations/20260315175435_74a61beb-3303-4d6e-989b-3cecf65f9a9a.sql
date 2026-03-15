
CREATE TABLE public.crm_field_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, field_name)
);

ALTER TABLE public.crm_field_order ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view crm_field_order"
ON public.crm_field_order FOR SELECT TO authenticated
USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can manage crm_field_order"
ON public.crm_field_order FOR ALL TO authenticated
USING (organization_id IN (SELECT get_user_org_ids(auth.uid())))
WITH CHECK (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Superadmins can manage all crm_field_order"
ON public.crm_field_order FOR ALL TO authenticated
USING (is_superadmin(auth.uid()))
WITH CHECK (is_superadmin(auth.uid()));
