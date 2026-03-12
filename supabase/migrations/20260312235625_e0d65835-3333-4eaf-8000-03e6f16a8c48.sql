-- Add superadmin bypass SELECT policies to tables missing them
CREATE POLICY "Superadmins can view all interactions"
  ON interactions FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can manage all interactions"
  ON interactions FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can view all tasks"
  ON tasks FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can manage all tasks"
  ON tasks FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can view all interest_levels"
  ON interest_levels FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can view all payment_methods"
  ON payment_methods FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can view all tags"
  ON tags FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can view all role_permissions"
  ON role_permissions FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can view all ai_cache"
  ON ai_cache FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can view all product_sales_stages"
  ON product_sales_stages FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()));

-- Add superadmin write policies for tables that need full CRUD
CREATE POLICY "Superadmins can manage all leads"
  ON leads FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can manage all sales"
  ON sales FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can manage all products"
  ON products FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can manage all pipeline_stages"
  ON pipeline_stages FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));