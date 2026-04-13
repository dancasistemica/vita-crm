-- Remove SECURITY DEFINER and add search_path to the admin check function
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id uuid) 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- Re-create the view with security_barrier to be extra safe and resolve linter issues
DROP VIEW IF EXISTS public.integrations;

CREATE VIEW public.integrations WITH (security_barrier) AS
SELECT
  id,
  organization_id,
  integration_type,
  name,
  description,
  is_active,
  status,
  CASE 
    WHEN is_org_admin(organization_id) THEN credentials 
    ELSE NULL 
  END as credentials,
  sync_config,
  error_message,
  created_at,
  updated_at
FROM public.integrations_secure;

-- Re-attach the triggers after view recreation
CREATE TRIGGER instead_of_insert_integrations
INSTEAD OF INSERT ON public.integrations
FOR EACH ROW EXECUTE FUNCTION public.handle_integrations_insert();

CREATE TRIGGER instead_of_update_integrations
INSTEAD OF UPDATE ON public.integrations
FOR EACH ROW EXECUTE FUNCTION public.handle_integrations_update();

CREATE TRIGGER instead_of_delete_integrations
INSTEAD OF DELETE ON public.integrations
FOR EACH ROW EXECUTE FUNCTION public.handle_integrations_delete();
