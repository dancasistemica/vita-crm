-- Função para verificar se o usuário tem e-mail confirmado
CREATE OR REPLACE FUNCTION public.is_user_verified(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = _user_id AND email_confirmed_at IS NOT NULL
  )
$function$;

-- Ajustar a política de inserção em organization_members
DROP POLICY IF EXISTS "organization_members_insert_policy" ON public.organization_members;

CREATE POLICY "organization_members_insert_policy" ON public.organization_members
FOR INSERT TO authenticated
WITH CHECK (
  (
    -- 1. O autor deve ser proprietário ou administrador da organização ALVO
    (EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE id = organization_id AND owner_id = auth.uid()
    ))
    OR
    (
      (public.get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]))
      AND (auth.uid() <> user_id)
    )
    OR
    public.is_superadmin(auth.uid())
  )
  AND
  -- 2. O usuário sendo adicionado deve existir e ser verificado
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id
  )
  AND public.is_user_verified(user_id)
);

-- Corrigir a política de atualização para impedir movimentação entre organizações
DROP POLICY IF EXISTS "Owners/admins can update members" ON public.organization_members;

CREATE POLICY "Owners/admins can update members" ON public.organization_members
FOR UPDATE TO authenticated
USING (
  (public.get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]))
  OR public.is_superadmin(auth.uid())
)
WITH CHECK (
  (
    (public.get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner'::org_role, 'admin'::org_role]))
    OR public.is_superadmin(auth.uid())
  )
  -- Impede a alteração do ID da organização para evitar escalonamento cross-tenant
  AND (organization_id = (SELECT m.organization_id FROM public.organization_members m WHERE m.id = id))
);
