ALTER TABLE public.integrations 
ADD CONSTRAINT integrations_org_type_key UNIQUE (organization_id, integration_type);
