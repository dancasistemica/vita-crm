
-- Add superadmin management policy for task_statuses (matching pattern of other tables)
CREATE POLICY "Superadmins can manage all task_statuses"
ON task_statuses
FOR ALL
TO authenticated
USING (is_superadmin(auth.uid()))
WITH CHECK (is_superadmin(auth.uid()));
