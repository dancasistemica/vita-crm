
-- 1. Create superadmin_roles table (roles in separate table per security best practice)
CREATE TABLE public.superadmin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.superadmin_roles ENABLE ROW LEVEL SECURITY;

-- 2. Create is_superadmin security definer function
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.superadmin_roles WHERE user_id = _user_id
  )
$$;

-- 3. RLS for superadmin_roles: only superadmins can SELECT
CREATE POLICY "Superadmins can view superadmin_roles"
  ON public.superadmin_roles FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can insert superadmin_roles"
  ON public.superadmin_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can delete superadmin_roles"
  ON public.superadmin_roles FOR DELETE TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- 4. Create organization_plans table
CREATE TABLE public.organization_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  value numeric(10,2) NOT NULL,
  period text NOT NULL DEFAULT 'monthly',
  max_users integer NOT NULL DEFAULT 5,
  max_leads integer,
  max_integrations integer,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organization_plans ENABLE ROW LEVEL SECURITY;

-- RLS for organization_plans
CREATE POLICY "Authenticated can view active plans"
  ON public.organization_plans FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Superadmins can insert plans"
  ON public.organization_plans FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can update plans"
  ON public.organization_plans FOR UPDATE TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can delete plans"
  ON public.organization_plans FOR DELETE TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- 5. Add plan_id to organizations
ALTER TABLE public.organizations ADD COLUMN plan_id uuid REFERENCES public.organization_plans(id);

-- 6. Additional RLS on organizations for superadmins
CREATE POLICY "Superadmins can view all orgs"
  ON public.organizations FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can update all orgs"
  ON public.organizations FOR UPDATE TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- 7. Additional RLS on profiles for superadmins
CREATE POLICY "Superadmins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- 8. Additional RLS on organization_members for superadmins
CREATE POLICY "Superadmins can view all members"
  ON public.organization_members FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));
