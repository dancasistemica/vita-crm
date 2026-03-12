
-- Function to check if ANY superadmin exists (callable by anon/authenticated)
CREATE OR REPLACE FUNCTION public.has_any_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.superadmin_roles LIMIT 1)
$$;

-- Function to bootstrap first superadmin (only works if none exist)
CREATE OR REPLACE FUNCTION public.bootstrap_first_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if no superadmins exist
  IF EXISTS (SELECT 1 FROM public.superadmin_roles LIMIT 1) THEN
    RAISE EXCEPTION 'Superadmin already exists';
  END IF;

  INSERT INTO public.superadmin_roles (user_id)
  VALUES (_user_id);

  RETURN true;
END;
$$;
