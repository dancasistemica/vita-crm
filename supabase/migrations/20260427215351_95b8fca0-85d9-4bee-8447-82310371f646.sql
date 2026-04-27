-- Revoke execute from public for sensitive SECURITY DEFINER functions with correct signatures
REVOKE EXECUTE ON FUNCTION public.get_tables_info() FROM public;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_superadmin(uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.seed_default_pipeline_stages() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;

-- For functions that are used by the app, ensure only authenticated users can call them
REVOKE EXECUTE ON FUNCTION public.is_superadmin(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_superadmin(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_org_ids(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_user_org_ids(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_org_role(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_org_role(uuid, uuid) TO authenticated;
