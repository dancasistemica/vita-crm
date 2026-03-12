CREATE POLICY "Org members can view fellow member profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT om.user_id FROM public.organization_members om
    WHERE om.organization_id IN (
      SELECT get_user_org_ids(auth.uid())
    )
  )
);