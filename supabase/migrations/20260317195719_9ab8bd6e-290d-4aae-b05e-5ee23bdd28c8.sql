
-- Create custom_fields table
CREATE TABLE public.custom_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL,
  field_options JSONB DEFAULT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Validation trigger for field_type instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_custom_field_type()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.field_type NOT IN ('text', 'number', 'date', 'select', 'textarea', 'checkbox') THEN
    RAISE EXCEPTION 'Invalid field_type: %. Must be one of: text, number, date, select, textarea, checkbox', NEW.field_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_custom_field_type
  BEFORE INSERT OR UPDATE ON public.custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_custom_field_type();

-- Enable RLS
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;

-- Superadmins full access
CREATE POLICY "Superadmins can manage all custom_fields"
ON public.custom_fields FOR ALL TO authenticated
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

-- Org admins can manage their org's custom fields
CREATE POLICY "Admins can manage custom_fields"
ON public.custom_fields FOR ALL TO authenticated
USING (public.get_org_role(auth.uid(), organization_id) IN ('owner', 'admin'))
WITH CHECK (public.get_org_role(auth.uid(), organization_id) IN ('owner', 'admin'));

-- Org members can view custom fields
CREATE POLICY "Org members can view custom_fields"
ON public.custom_fields FOR SELECT TO authenticated
USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Add custom_data JSONB column to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;
