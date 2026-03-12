
-- Custom roles table per organization
CREATE TABLE public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Enable RLS
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Org members can view their org's custom roles
CREATE POLICY "Org members can view custom_roles"
  ON public.custom_roles FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

-- Superadmins can view all custom_roles
CREATE POLICY "Superadmins can view all custom_roles"
  ON public.custom_roles FOR SELECT
  TO authenticated
  USING (is_superadmin(auth.uid()));

-- Admins/owners can manage custom_roles
CREATE POLICY "Admins can manage custom_roles"
  ON public.custom_roles FOR ALL
  TO authenticated
  USING (get_org_role(auth.uid(), organization_id) IN ('owner'::org_role, 'admin'::org_role))
  WITH CHECK (get_org_role(auth.uid(), organization_id) IN ('owner'::org_role, 'admin'::org_role));

-- Superadmins can manage all custom_roles
CREATE POLICY "Superadmins can manage all custom_roles"
  ON public.custom_roles FOR ALL
  TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));
