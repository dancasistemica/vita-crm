-- Adicionar colunas de desconto à tabela sales
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20), -- 'none', 'fixed', 'percentage'
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS discount_description TEXT,
ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS discount_granted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS discount_granted_at TIMESTAMP;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_sales_discount ON sales(discount_type);
CREATE INDEX IF NOT EXISTS idx_sales_discount_granted_by ON sales(discount_granted_by);

-- Adicionar comentários para documentação
COMMENT ON COLUMN sales.discount_type IS 'Tipo de desconto: none, fixed (R$), percentage (%)';
COMMENT ON COLUMN sales.discount_value IS 'Valor do desconto (em R$ ou %)';
COMMENT ON COLUMN sales.discount_description IS 'Motivo/descrição do desconto';
COMMENT ON COLUMN sales.original_amount IS 'Valor original antes do desconto';
COMMENT ON COLUMN sales.final_amount IS 'Valor final após desconto';
COMMENT ON COLUMN sales.discount_granted_by IS 'ID do usuário que concedeu o desconto';
COMMENT ON COLUMN sales.discount_granted_at IS 'Data/hora que o desconto foi concedido';