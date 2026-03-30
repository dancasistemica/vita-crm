-- Adicionar coluna sale_type em product_sales_stages
ALTER TABLE public.product_sales_stages
ADD COLUMN IF NOT EXISTS sale_type text DEFAULT 'unica'; -- 'unica' | 'mensalidade'

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_product_sales_stages_sale_type ON public.product_sales_stages(sale_type);

-- Comentário para documentação
COMMENT ON COLUMN public.product_sales_stages.sale_type IS 'Tipo de venda: unica (pagamento único) ou mensalidade (recorrente mensal)';