
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to UUID;

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_org_assigned ON public.tasks(organization_id, assigned_to);
