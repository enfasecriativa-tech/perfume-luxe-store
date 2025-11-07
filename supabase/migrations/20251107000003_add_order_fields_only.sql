-- Adicionar apenas os campos necessários na tabela sales (pedidos)
-- Este SQL não toca nas políticas RLS

-- Adicionar campos na tabela sales
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_method TEXT,
ADD COLUMN IF NOT EXISTS shipping_days INTEGER,
ADD COLUMN IF NOT EXISTS delivery_zip_code TEXT,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS order_number TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN DEFAULT false;

-- Criar constraint de unicidade para order_number se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_order_number_key'
  ) THEN
    ALTER TABLE public.sales ADD CONSTRAINT sales_order_number_key UNIQUE (order_number);
  END IF;
END $$;

-- Criar índice para order_number se não existir
CREATE INDEX IF NOT EXISTS idx_sales_order_number ON public.sales(order_number);

-- Criar função para gerar número do pedido
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  year_month TEXT;
  sequence_num INTEGER;
BEGIN
  -- Formato: YYYYMM-XXXXX (exemplo: 202511-00001)
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  
  -- Buscar o último número de pedido do mês
  SELECT COALESCE(
    MAX(
      CAST(
        SPLIT_PART(order_number, '-', 2) AS INTEGER
      )
    ), 0
  ) + 1
  INTO sequence_num
  FROM public.sales
  WHERE order_number LIKE year_month || '-%';
  
  -- Formatar com zeros à esquerda
  new_number := year_month || '-' || LPAD(sequence_num::TEXT, 5, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para gerar order_number automaticamente
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_set_order_number ON public.sales;

-- Criar trigger
CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION set_order_number();

-- Adicionar campos na tabela sales_items
ALTER TABLE public.sales_items
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS product_brand TEXT,
ADD COLUMN IF NOT EXISTS product_size TEXT,
ADD COLUMN IF NOT EXISTS product_image_url TEXT,
ADD COLUMN IF NOT EXISTS variant_id UUID;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_items_sale_id ON public.sales_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_product_id ON public.sales_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);

