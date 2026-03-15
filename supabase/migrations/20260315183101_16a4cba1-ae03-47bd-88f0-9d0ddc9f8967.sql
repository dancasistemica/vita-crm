
-- Add superadmin management policies for lead_origins
CREATE POLICY "Superadmins can manage all lead_origins"
ON public.lead_origins
FOR ALL
TO authenticated
USING (is_superadmin(auth.uid()))
WITH CHECK (is_superadmin(auth.uid()));

-- Add superadmin management policies for interest_levels
CREATE POLICY "Superadmins can manage all interest_levels"
ON public.interest_levels
FOR ALL
TO authenticated
USING (is_superadmin(auth.uid()))
WITH CHECK (is_superadmin(auth.uid()));
