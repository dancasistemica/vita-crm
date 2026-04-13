-- Corrigir a política de inserção em organization_members para garantir isolamento entre locatários
DROP POLICY IF EXISTS "organization_members_insert_policy" ON public.organization_members;

CREATE POLICY "organization_members_insert_policy" ON public.organization_members
FOR INSERT TO authenticated
WITH CHECK (
  (
    -- 1. O autor deve ser superadmin ou administrador da organização ALVO
    public.is_superadmin(auth.uid())
    OR 
    (
      public.is_user_verified(auth.uid()) 
      AND (public.get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]))
      AND (auth.uid() <> user_id)
    )
  )
  AND
  -- 2. O usuário sendo adicionado deve existir e ser verificado
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id
  )
  AND public.is_user_verified(user_id)
);

-- Corrigir a política de atualização para impedir movimentação entre organizações (cross-tenant escalation)
DROP POLICY IF EXISTS "Owners/admins can update members" ON public.organization_members;
DROP POLICY IF EXISTS "organization_members_update_policy" ON public.organization_members;

CREATE POLICY "organization_members_update_policy" ON public.organization_members
FOR UPDATE TO authenticated
USING (
  public.get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role])
  OR public.is_superadmin(auth.uid())
)
WITH CHECK (
  (
    public.get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role])
    OR public.is_superadmin(auth.uid())
  )
  -- Impede a alteração do ID da organização para evitar escalonamento cross-tenant
  AND (organization_id = (SELECT m.organization_id FROM public.organization_members m WHERE m.id = id))
);
