
CREATE OR REPLACE FUNCTION public.validate_custom_field_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.field_type NOT IN ('text', 'number', 'date', 'select', 'textarea', 'checkbox') THEN
    RAISE EXCEPTION 'Invalid field_type: %. Must be one of: text, number, date, select, textarea, checkbox', NEW.field_type;
  END IF;
  RETURN NEW;
END;
$$;
