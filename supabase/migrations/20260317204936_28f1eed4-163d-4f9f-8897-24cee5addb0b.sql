
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- SuperAdmin can manage
CREATE POLICY "superadmin_manage_system_settings"
ON public.system_settings FOR ALL TO authenticated
USING (is_superadmin(auth.uid()))
WITH CHECK (is_superadmin(auth.uid()));

-- All authenticated can read (needed for inheritance)
CREATE POLICY "authenticated_read_system_settings"
ON public.system_settings FOR SELECT TO authenticated
USING (true);

-- Insert default values
INSERT INTO public.system_settings (setting_key, setting_value) VALUES
  ('system_name', 'Vita CRM'),
  ('primary_color', '#C4707A'),
  ('secondary_color', '#F3E8FF'),
  ('accent_color', '#C026D3'),
  ('sidebar_bg_color', '240 10% 10%'),
  ('logo_url', NULL),
  ('favicon_url', NULL),
  ('font_family', 'DM Sans')
ON CONFLICT (setting_key) DO NOTHING;

-- Create storage bucket for system assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('system-assets', 'system-assets', true)
ON CONFLICT (id) DO NOTHING;

-- SuperAdmin can upload to system-assets
CREATE POLICY "superadmin_upload_system_assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'system-assets'
  AND is_superadmin(auth.uid())
);

-- SuperAdmin can update system-assets
CREATE POLICY "superadmin_update_system_assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'system-assets'
  AND is_superadmin(auth.uid())
);

-- SuperAdmin can delete system-assets
CREATE POLICY "superadmin_delete_system_assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'system-assets'
  AND is_superadmin(auth.uid())
);

-- Public can read system-assets
CREATE POLICY "public_read_system_assets"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'system-assets');
