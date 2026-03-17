
-- Create email_templates table
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_type text NOT NULL CHECK (template_type IN ('confirmation_email', 'reset_password')),
  subject text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  logo_url text,
  primary_color text NOT NULL DEFAULT '#3b82f6',
  secondary_color text NOT NULL DEFAULT '#e5e7eb',
  text_color text NOT NULL DEFAULT '#1f2937',
  button_text text NOT NULL DEFAULT '',
  button_link text NOT NULL DEFAULT '{{link}}',
  footer_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, template_type)
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Only superadmins can manage email_templates
CREATE POLICY "Superadmins can manage email_templates"
  ON public.email_templates FOR ALL
  TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- Org admins can view their own templates
CREATE POLICY "Org members can view own email_templates"
  ON public.email_templates FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

-- Create index
CREATE INDEX idx_email_templates_org_type ON public.email_templates(organization_id, template_type);

-- Create brand-assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for brand-assets
CREATE POLICY "Superadmins can upload brand assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'brand-assets' AND is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can update brand assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'brand-assets' AND is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can delete brand assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'brand-assets' AND is_superadmin(auth.uid()));

CREATE POLICY "Anyone can view brand assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'brand-assets');
