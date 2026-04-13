-- Update sale_installments RLS policies to allow superadmins and organization members
DROP POLICY IF EXISTS "Membros da organização podem gerenciar parcelas" ON public.sale_installments;
DROP POLICY IF EXISTS "Membros da organização podem visualizar parcelas" ON public.sale_installments;

CREATE POLICY "Manage sale installments" ON public.sale_installments
FOR ALL TO authenticated
USING (
  (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())) 
  OR 
  (public.is_superadmin(auth.uid()))
);

-- Update subscription_payments RLS policies
DROP POLICY IF EXISTS "Membros da organização podem gerenciar pagamentos" ON public.subscription_payments;
DROP POLICY IF EXISTS "Membros da organização podem visualizar pagamentos" ON public.subscription_payments;

CREATE POLICY "Manage subscription payments" ON public.subscription_payments
FOR ALL TO authenticated
USING (
  (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())) 
  OR 
  (public.is_superadmin(auth.uid()))
);

-- Ensure client_products has consistent RLS
DROP POLICY IF EXISTS "Membros da organização podem gerenciar produtos de clientes" ON public.client_products;
DROP POLICY IF EXISTS "Membros da organização podem visualizar produtos de clientes" ON public.client_products;

CREATE POLICY "Manage client products" ON public.client_products
FOR ALL TO authenticated
USING (
  (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())) 
  OR 
  (public.is_superadmin(auth.uid()))
);
