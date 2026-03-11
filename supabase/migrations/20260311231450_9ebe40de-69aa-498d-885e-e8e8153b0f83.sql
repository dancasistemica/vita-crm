
-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sales_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_origins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Security definer function: get user's org ids
CREATE OR REPLACE FUNCTION public.get_user_org_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = _user_id;
$$;

-- Security definer: check org membership
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  );
$$;

-- Security definer: check org role
CREATE OR REPLACE FUNCTION public.get_org_role(_user_id UUID, _org_id UUID)
RETURNS org_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.organization_members
  WHERE user_id = _user_id AND organization_id = _org_id;
$$;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Organizations: members can view their orgs
CREATE POLICY "Members can view their orgs" ON public.organizations
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Owners can update their org" ON public.organizations
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());
CREATE POLICY "Auth users can create orgs" ON public.organizations
  FOR INSERT TO authenticated WITH CHECK (true);

-- Organization members: members can view their org's members
CREATE POLICY "Members can view org members" ON public.organization_members
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Owners/admins can manage members" ON public.organization_members
  FOR INSERT TO authenticated
  WITH CHECK (public.get_org_role(auth.uid(), organization_id) IN ('owner', 'admin'));
CREATE POLICY "Owners/admins can update members" ON public.organization_members
  FOR UPDATE TO authenticated
  USING (public.get_org_role(auth.uid(), organization_id) IN ('owner', 'admin'));
CREATE POLICY "Owners can delete members" ON public.organization_members
  FOR DELETE TO authenticated
  USING (public.get_org_role(auth.uid(), organization_id) = 'owner');

-- Macro for org-scoped tables: all CRUD scoped to user's orgs
-- Leads
CREATE POLICY "Org members can view leads" ON public.leads
  FOR SELECT TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can insert leads" ON public.leads
  FOR INSERT TO authenticated WITH CHECK (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can update leads" ON public.leads
  FOR UPDATE TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can delete leads" ON public.leads
  FOR DELETE TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Products
CREATE POLICY "Org members can view products" ON public.products
  FOR SELECT TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can update products" ON public.products
  FOR UPDATE TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can delete products" ON public.products
  FOR DELETE TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Product sales stages (via product's org)
CREATE POLICY "Org members can view product stages" ON public.product_sales_stages
  FOR SELECT TO authenticated
  USING (product_id IN (SELECT id FROM public.products WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))));
CREATE POLICY "Org members can manage product stages" ON public.product_sales_stages
  FOR ALL TO authenticated
  USING (product_id IN (SELECT id FROM public.products WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))));

-- Sales
CREATE POLICY "Org members can view sales" ON public.sales
  FOR SELECT TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can insert sales" ON public.sales
  FOR INSERT TO authenticated WITH CHECK (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can update sales" ON public.sales
  FOR UPDATE TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can delete sales" ON public.sales
  FOR DELETE TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Interactions
CREATE POLICY "Org members can view interactions" ON public.interactions
  FOR SELECT TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can insert interactions" ON public.interactions
  FOR INSERT TO authenticated WITH CHECK (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can update interactions" ON public.interactions
  FOR UPDATE TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can delete interactions" ON public.interactions
  FOR DELETE TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Tasks
CREATE POLICY "Org members can view tasks" ON public.tasks
  FOR SELECT TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can insert tasks" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can update tasks" ON public.tasks
  FOR UPDATE TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can delete tasks" ON public.tasks
  FOR DELETE TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Pipeline stages
CREATE POLICY "Org members can view stages" ON public.pipeline_stages
  FOR SELECT TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can manage stages" ON public.pipeline_stages
  FOR ALL TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Lead origins
CREATE POLICY "Org members can view origins" ON public.lead_origins
  FOR SELECT TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can manage origins" ON public.lead_origins
  FOR ALL TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Tags
CREATE POLICY "Org members can view tags" ON public.tags
  FOR SELECT TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can manage tags" ON public.tags
  FOR ALL TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Interest levels
CREATE POLICY "Org members can view interest levels" ON public.interest_levels
  FOR SELECT TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can manage interest levels" ON public.interest_levels
  FOR ALL TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Payment methods
CREATE POLICY "Org members can view payment methods" ON public.payment_methods
  FOR SELECT TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org members can manage payment methods" ON public.payment_methods
  FOR ALL TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Role permissions
CREATE POLICY "Org members can view permissions" ON public.role_permissions
  FOR SELECT TO authenticated USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Admins can manage permissions" ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.get_org_role(auth.uid(), organization_id) IN ('owner', 'admin'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
