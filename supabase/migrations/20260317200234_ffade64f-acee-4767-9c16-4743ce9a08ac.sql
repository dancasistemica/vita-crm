
-- Add superadmin full access to brand_settings
CREATE POLICY "Superadmins can manage all brand_settings"
ON public.brand_settings
FOR ALL
TO authenticated
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));
