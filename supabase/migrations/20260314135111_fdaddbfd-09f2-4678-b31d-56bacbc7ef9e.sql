
-- 1. Create task_statuses table
CREATE TABLE IF NOT EXISTS public.task_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- 2. Add status_id to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status_id UUID REFERENCES public.task_statuses(id) ON DELETE SET NULL;

-- 3. Create task_notifications table
CREATE TABLE IF NOT EXISTS public.task_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_task_statuses_org ON public.task_statuses(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status_id ON public.tasks(status_id);
CREATE INDEX IF NOT EXISTS idx_task_notifications_user ON public.task_notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_task_notifications_org ON public.task_notifications(organization_id);

-- 5. Enable RLS
ALTER TABLE public.task_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_notifications ENABLE ROW LEVEL SECURITY;

-- 6. RLS for task_statuses
CREATE POLICY "Org members can view task_statuses" ON public.task_statuses
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can manage task_statuses" ON public.task_statuses
  FOR ALL TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids(auth.uid())))
  WITH CHECK (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Superadmins can view all task_statuses" ON public.task_statuses
  FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()));

-- 7. RLS for task_notifications
CREATE POLICY "Users can view own notifications" ON public.task_notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Org members can insert notifications" ON public.task_notifications
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT get_user_org_ids(auth.uid())));

CREATE POLICY "Users can update own notifications" ON public.task_notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
