-- Adicionar colunas de desconto à tabela sales
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20), -- 'fixed' ou 'percentage'
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS discount_description TEXT,
ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10, 2);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_sales_discount ON sales(discount_type);

-- Adicionar comentários para documentação
COMMENT ON COLUMN sales.discount_type IS 'Tipo de desconto: fixed (valor fixo em R$) ou percentage (percentual %)';
COMMENT ON COLUMN sales.discount_value IS 'Valor do desconto (em R$ ou %)';
COMMENT ON COLUMN sales.discount_description IS 'Descrição/motivo do desconto aplicado';
COMMENT ON COLUMN sales.original_amount IS 'Valor original antes do desconto';
COMMENT ON COLUMN sales.final_amount IS 'Valor final após desconto';