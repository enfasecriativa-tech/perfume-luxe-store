-- Adicionar campos necessários na tabela sales (pedidos)
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_method TEXT,
ADD COLUMN IF NOT EXISTS shipping_days INTEGER,
ADD COLUMN IF NOT EXISTS delivery_zip_code TEXT,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN DEFAULT false;

-- Criar índice para order_number
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

DROP TRIGGER IF EXISTS trigger_set_order_number ON public.sales;
CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION set_order_number();

-- Adicionar campos na tabela sales_items para incluir informações do produto
ALTER TABLE public.sales_items
ADD COLUMN IF NOT EXISTS product_name TEXT,
ADD COLUMN IF NOT EXISTS product_brand TEXT,
ADD COLUMN IF NOT EXISTS product_size TEXT,
ADD COLUMN IF NOT EXISTS product_image_url TEXT,
ADD COLUMN IF NOT EXISTS variant_id UUID;

-- Atualizar políticas RLS para permitir que usuários vejam seus próprios pedidos
CREATE POLICY "Users can view own orders"
ON public.sales
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Permitir usuários criarem seus próprios pedidos
CREATE POLICY "Users can create own orders"
ON public.sales
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Usuários podem ver os itens de seus próprios pedidos
CREATE POLICY "Users can view own order items"
ON public.sales_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sales
    WHERE sales.id = sales_items.sale_id
    AND (sales.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Usuários podem criar itens para seus próprios pedidos
CREATE POLICY "Users can create own order items"
ON public.sales_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sales
    WHERE sales.id = sales_items.sale_id
    AND sales.user_id = auth.uid()
  )
);

-- Comentários nas tabelas para documentação
COMMENT ON COLUMN public.sales.shipping_cost IS 'Custo do frete em reais';
COMMENT ON COLUMN public.sales.shipping_method IS 'Método de envio (SEDEX, PAC, etc)';
COMMENT ON COLUMN public.sales.shipping_days IS 'Prazo de entrega em dias';
COMMENT ON COLUMN public.sales.delivery_zip_code IS 'CEP de entrega';
COMMENT ON COLUMN public.sales.discount_amount IS 'Valor do desconto aplicado';
COMMENT ON COLUMN public.sales.order_number IS 'Número único do pedido (formato: YYYYMM-XXXXX)';
COMMENT ON COLUMN public.sales.whatsapp_sent IS 'Indica se o pedido foi enviado via WhatsApp';
COMMENT ON COLUMN public.sales.status IS 'Status do pedido: pending, processing, completed, cancelled';
COMMENT ON COLUMN public.sales.payment_status IS 'Status do pagamento: pending, paid, failed';

-- Criar índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_items_sale_id ON public.sales_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_product_id ON public.sales_items(product_id);

