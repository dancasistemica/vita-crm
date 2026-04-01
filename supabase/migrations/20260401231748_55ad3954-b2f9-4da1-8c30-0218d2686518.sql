-- Ativar RLS na tabela sale_installments
ALTER TABLE public.sale_installments ENABLE ROW LEVEL SECURITY;

-- Política de visualização para membros da organização
CREATE POLICY "Membros da organização podem visualizar parcelas"
ON public.sale_installments
FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_org_ids(auth.uid())));

-- Política de gestão para membros da organização
CREATE POLICY "Membros da organização podem gerenciar parcelas"
ON public.sale_installments
FOR ALL
TO authenticated
USING (organization_id IN (SELECT get_user_org_ids(auth.uid())))
WITH CHECK (organization_id IN (SELECT get_user_org_ids(auth.uid())));