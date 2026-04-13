-- 1. Restrict integrations.credentials to owners and administrators
-- Rename the table to store the actual data securely
ALTER TABLE public.integrations RENAME TO integrations_secure;

-- Helper function to check if user is admin or owner
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create a view that masks the credentials column for non-admins
CREATE VIEW public.integrations AS
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

-- Add INSTEAD OF triggers to keep the view updatable
CREATE OR REPLACE FUNCTION public.handle_integrations_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.integrations_secure (
    organization_id, integration_type, name, description, is_active, status, credentials, sync_config, error_message
  ) VALUES (
    NEW.organization_id, NEW.integration_type, NEW.name, NEW.description, NEW.is_active, NEW.status, NEW.credentials, NEW.sync_config, NEW.error_message
  ) RETURNING * INTO NEW;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER instead_of_insert_integrations
INSTEAD OF INSERT ON public.integrations
FOR EACH ROW EXECUTE FUNCTION public.handle_integrations_insert();

CREATE OR REPLACE FUNCTION public.handle_integrations_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.integrations_secure SET
    organization_id = NEW.organization_id,
    integration_type = NEW.integration_type,
    name = NEW.name,
    description = NEW.description,
    is_active = NEW.is_active,
    status = NEW.status,
    -- If credentials was provided, update it. If it was masked (NULL in the view), 
    -- keep the old value if the user didn't intentionally send NULL.
    -- However, usually, if it's masked, they shouldn't be sending it back.
    credentials = COALESCE(NEW.credentials, credentials),
    sync_config = NEW.sync_config,
    error_message = NEW.error_message,
    updated_at = now()
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER instead_of_update_integrations
INSTEAD OF UPDATE ON public.integrations
FOR EACH ROW EXECUTE FUNCTION public.handle_integrations_update();

CREATE OR REPLACE FUNCTION public.handle_integrations_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.integrations_secure WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER instead_of_delete_integrations
INSTEAD OF DELETE ON public.integrations
FOR EACH ROW EXECUTE FUNCTION public.handle_integrations_delete();

-- 2. Add RLS policies to realtime.messages
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Policy to restrict subscriptions to topics that contain organization IDs
-- This handles topics like 'pipeline_stages:org:UUID', 'interest_levels:org:UUID', etc.
CREATE POLICY "Users can subscribe to their organization topics"
ON realtime.messages
FOR SELECT
USING (
  (topic LIKE '%:org:%' AND 
   (split_part(topic, ':', 3))::uuid IN (
     SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
   )
  ) OR
  (topic = 'tasks-dashboard') -- General dashboard topic
  OR
  (topic LIKE 'timeline-%') -- Timeline topic (linked to lead_id)
);
