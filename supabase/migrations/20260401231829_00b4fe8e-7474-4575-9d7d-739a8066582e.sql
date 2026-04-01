-- Remover a política insegura
DROP POLICY IF EXISTS "botconversa_config_all" ON public.botconversa_config;

-- Criar política de visualização para membros da organização
CREATE POLICY "Membros da organização podem ver configs botconversa"
ON public.botconversa_config
FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

-- Criar política de gestão para membros da organização
CREATE POLICY "Membros da organização podem gerenciar configs botconversa"
ON public.botconversa_config
FOR ALL
TO authenticated
USING (organization_id IN (SELECT get_user_org_ids(auth.uid())))
WITH CHECK (organization_id IN (SELECT get_user_org_ids(auth.uid())));