-- Brand settings table
CREATE TABLE public.brand_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  primary_color text NOT NULL DEFAULT '#C4707A',
  secondary_color text NOT NULL DEFAULT '#F3E8FF',
  accent_color text NOT NULL DEFAULT '#C026D3',
  sidebar_color text NOT NULL DEFAULT '240 10% 10%',
  logo_url text,
  favicon_url text,
  org_display_name text,
  font_family text NOT NULL DEFAULT 'DM Sans',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view brand_settings"
  ON public.brand_settings FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Admins can manage brand_settings"
  ON public.brand_settings FOR ALL TO authenticated
  USING (get_org_role(auth.uid(), organization_id) IN ('owner', 'admin'))
  WITH CHECK (get_org_role(auth.uid(), organization_id) IN ('owner', 'admin'));

-- Logos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

CREATE POLICY "Authenticated users can upload logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Anyone can view logos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can update logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can delete logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'logos');