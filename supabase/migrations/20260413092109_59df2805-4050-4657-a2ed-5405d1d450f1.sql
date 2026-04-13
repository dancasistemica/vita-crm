-- Re-create the view with security_invoker = true to resolve the linter error
DROP VIEW IF EXISTS public.integrations;

CREATE VIEW public.integrations WITH (security_invoker = true) AS
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
