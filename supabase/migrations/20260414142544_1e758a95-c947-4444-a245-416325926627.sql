CREATE OR REPLACE FUNCTION public.get_tables_info()
RETURNS TABLE (name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    table_name::text as name
  FROM information_schema.tables
  WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE 'pg_%'
    AND table_name NOT LIKE 'sql_%'
  ORDER BY table_name;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_tables_info() TO authenticated;