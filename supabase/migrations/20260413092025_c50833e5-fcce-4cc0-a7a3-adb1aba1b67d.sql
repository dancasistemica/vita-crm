-- Set search_path and fix linter warnings
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Update trigger functions with search_path
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
$$ LANGUAGE plpgsql SET search_path = public;

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
    credentials = CASE 
      WHEN NEW.credentials IS NOT NULL THEN NEW.credentials 
      ELSE credentials 
    END,
    sync_config = NEW.sync_config,
    error_message = NEW.error_message,
    updated_at = now()
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_integrations_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.integrations_secure WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Refine Realtime policy
DROP POLICY IF EXISTS "Users can subscribe to their organization topics" ON realtime.messages;

CREATE POLICY "Users can subscribe to their organization topics"
ON realtime.messages
FOR SELECT
USING (
  -- Handle organization-specific topics
  (topic LIKE '%:org:%' AND 
   (split_part(topic, ':', 3))::uuid IN (
     SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
   )
  ) 
  OR
  -- Handle general topics
  (topic = 'tasks-dashboard')
  OR
  -- Handle timeline topics (requires lead ownership check)
  (topic LIKE 'timeline-%' AND 
   EXISTS (
     SELECT 1 FROM public.leads l
     JOIN public.organization_members om ON l.organization_id = om.organization_id
     WHERE ('timeline-' || l.id::text) = topic
     AND om.user_id = auth.uid()
   )
  )
);
