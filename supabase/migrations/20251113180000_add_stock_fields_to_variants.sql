-- Adicionar campos de estoque nas variações de produtos
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS quantity_in_stock INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_recommended_quantity INTEGER DEFAULT 1;

-- Comentários para documentação
COMMENT ON COLUMN public.product_variants.quantity_in_stock IS 'Quantidade em estoque desta variação';
COMMENT ON COLUMN public.product_variants.min_recommended_quantity IS 'Quantidade mínima recomendada para alerta de estoque baixo';



