-- Adicionar política para permitir que usuários criem itens de seus próprios pedidos
-- Esta correção resolve o erro RLS ao criar pedidos via carrinho

-- Usuários podem criar itens para seus próprios pedidos
CREATE POLICY IF NOT EXISTS "Users can create own order items"
ON public.sales_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sales
    WHERE sales.id = sales_items.sale_id
    AND sales.user_id = auth.uid()
  )
);

