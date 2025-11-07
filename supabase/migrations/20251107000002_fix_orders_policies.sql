-- Corrigir políticas RLS para pedidos
-- Remove políticas existentes e recria com as corretas

-- 1. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view own orders" ON public.sales;
DROP POLICY IF EXISTS "Users can create own orders" ON public.sales;
DROP POLICY IF EXISTS "Users can view own order items" ON public.sales_items;
DROP POLICY IF EXISTS "Users can create own order items" ON public.sales_items;

-- 2. Criar políticas corretas para sales (pedidos)

-- Usuários podem ver seus próprios pedidos OU admins veem todos
CREATE POLICY "Users can view own orders"
ON public.sales
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Usuários podem criar seus próprios pedidos
CREATE POLICY "Users can create own orders"
ON public.sales
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Criar políticas corretas para sales_items (itens do pedido)

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

