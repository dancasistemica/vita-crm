
CREATE OR REPLACE FUNCTION public.seed_default_pipeline_stages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.pipeline_stages (organization_id, name, sort_order) VALUES
    (NEW.id, 'Novo Lead', 0),
    (NEW.id, 'Contato', 1),
    (NEW.id, 'Negociação', 2),
    (NEW.id, 'Cliente', 3);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seed_pipeline_stages
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_default_pipeline_stages();
