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
      -- Verifica se o usuário autenticado já é um admin/owner da organização específica ANTES da inserção
      AND EXISTS (
        SELECT 1 FROM public.organization_members 
        WHERE user_id = auth.uid() 
        AND organization_id = organization_members.organization_id 
        AND role IN ('owner', 'admin')
      )
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
DROP POLICY IF EXISTS "organization_members_update_policy" ON public.organization_members;

CREATE POLICY "organization_members_update_policy" ON public.organization_members
FOR UPDATE TO authenticated
USING (
  -- O usuário deve ser admin da organização atual do registro
  EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE user_id = auth.uid() 
    AND organization_id = organization_members.organization_id 
    AND role IN ('owner', 'admin')
  )
  OR public.is_superadmin(auth.uid())
)
WITH CHECK (
  (
    -- E deve ser admin da (possível nova) organização do registro
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE user_id = auth.uid() 
      AND organization_id = organization_members.organization_id 
      AND role IN ('owner', 'admin')
    )
    OR public.is_superadmin(auth.uid())
  )
  -- Impede a alteração do ID da organização para evitar escalonamento cross-tenant
  AND (organization_id = (SELECT m.organization_id FROM public.organization_members m WHERE m.id = organization_members.id))
);