-- 1. CLEANUP 'clients'
DROP POLICY IF EXISTS "org_members_read_clients" ON clients;
DROP POLICY IF EXISTS "Users can view clients in their organization" ON clients;
DROP POLICY IF EXISTS "Users can insert clients in their organization" ON clients;
DROP POLICY IF EXISTS "Users can update clients in their organization" ON clients;
DROP POLICY IF EXISTS "Users can delete clients in their organization" ON clients;

-- 2. CLEANUP 'sales'
DROP POLICY IF EXISTS "Org members can view sales" ON sales;
DROP POLICY IF EXISTS "Org members can insert sales" ON sales;
DROP POLICY IF EXISTS "Org members can update sales" ON sales;
DROP POLICY IF EXISTS "Org members can delete sales" ON sales;

-- 3. CLEANUP 'leads'
DROP POLICY IF EXISTS "Org members can view leads" ON leads;
DROP POLICY IF EXISTS "Org members can insert leads" ON leads;
DROP POLICY IF EXISTS "Org members can update leads" ON leads;
DROP POLICY IF EXISTS "Org members can delete leads" ON leads;

-- 4. CLEANUP 'class_attendance'
DROP POLICY IF EXISTS "Users can view their own organization's class_attendance" ON class_attendance;
DROP POLICY IF EXISTS "Users can insert their own organization's class_attendance" ON class_attendance;
DROP POLICY IF EXISTS "Users can update their own organization's class_attendance" ON class_attendance;
DROP POLICY IF EXISTS "Users can delete their own organization's class_attendance" ON class_attendance;

-- 5. ENSURE POLICIES ARE PRESENT (using the new standard)
-- These should already be there from previous step, but re-defining to be safe and use get_user_org_ids for consistency
-- clients
DROP POLICY IF EXISTS "clients_select_policy" ON clients;
CREATE POLICY "clients_select_policy" ON clients FOR SELECT USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
DROP POLICY IF EXISTS "clients_insert_policy" ON clients;
CREATE POLICY "clients_insert_policy" ON clients FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids(auth.uid())));
DROP POLICY IF EXISTS "clients_update_policy" ON clients;
CREATE POLICY "clients_update_policy" ON clients FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids(auth.uid()))) WITH CHECK (organization_id IN (SELECT get_user_org_ids(auth.uid())));
DROP POLICY IF EXISTS "clients_delete_policy" ON clients;
CREATE POLICY "clients_delete_policy" ON clients FOR DELETE USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

-- sales
DROP POLICY IF EXISTS "sales_select_policy" ON sales;
CREATE POLICY "sales_select_policy" ON sales FOR SELECT USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
DROP POLICY IF EXISTS "sales_insert_policy" ON sales;
CREATE POLICY "sales_insert_policy" ON sales FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids(auth.uid())));
DROP POLICY IF EXISTS "sales_update_policy" ON sales;
CREATE POLICY "sales_update_policy" ON sales FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids(auth.uid()))) WITH CHECK (organization_id IN (SELECT get_user_org_ids(auth.uid())));
DROP POLICY IF EXISTS "sales_delete_policy" ON sales;
CREATE POLICY "sales_delete_policy" ON sales FOR DELETE USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

-- leads
DROP POLICY IF EXISTS "leads_select_policy" ON leads;
CREATE POLICY "leads_select_policy" ON leads FOR SELECT USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
DROP POLICY IF EXISTS "leads_insert_policy" ON leads;
CREATE POLICY "leads_insert_policy" ON leads FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids(auth.uid())));
DROP POLICY IF EXISTS "leads_update_policy" ON leads;
CREATE POLICY "leads_update_policy" ON leads FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids(auth.uid()))) WITH CHECK (organization_id IN (SELECT get_user_org_ids(auth.uid())));
DROP POLICY IF EXISTS "leads_delete_policy" ON leads;
CREATE POLICY "leads_delete_policy" ON leads FOR DELETE USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

-- class_attendance
DROP POLICY IF EXISTS "class_attendance_select_policy" ON class_attendance;
CREATE POLICY "class_attendance_select_policy" ON class_attendance FOR SELECT USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
DROP POLICY IF EXISTS "class_attendance_insert_policy" ON class_attendance;
CREATE POLICY "class_attendance_insert_policy" ON class_attendance FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids(auth.uid())));
DROP POLICY IF EXISTS "class_attendance_update_policy" ON class_attendance;
CREATE POLICY "class_attendance_update_policy" ON class_attendance FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids(auth.uid()))) WITH CHECK (organization_id IN (SELECT get_user_org_ids(auth.uid())));
DROP POLICY IF EXISTS "class_attendance_delete_policy" ON class_attendance;
CREATE POLICY "class_attendance_delete_policy" ON class_attendance FOR DELETE USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));
