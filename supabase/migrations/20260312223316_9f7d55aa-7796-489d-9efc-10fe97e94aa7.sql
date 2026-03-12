CREATE POLICY "Admins can update their org"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  get_org_role(auth.uid(), id) IN ('owner'::org_role, 'admin'::org_role)
)
WITH CHECK (
  get_org_role(auth.uid(), id) IN ('owner'::org_role, 'admin'::org_role)
);