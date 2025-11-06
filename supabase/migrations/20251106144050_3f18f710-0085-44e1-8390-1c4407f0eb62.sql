-- Adicionar novos campos na tabela sales para integrar com usuários e endereços
ALTER TABLE public.sales
ADD COLUMN user_id UUID REFERENCES public.profiles(id),
ADD COLUMN shipping_address_id UUID REFERENCES public.addresses(id),
ADD COLUMN payment_proof_url TEXT,
ADD COLUMN status TEXT DEFAULT 'pending';

-- Criar índices para melhor performance
CREATE INDEX idx_sales_user_id ON public.sales(user_id);
CREATE INDEX idx_sales_status ON public.sales(status);

-- Atualizar RLS policies para sales_items permitir delete
DROP POLICY IF EXISTS "Admins can view all sales items" ON public.sales_items;
DROP POLICY IF EXISTS "Admins can insert sales items" ON public.sales_items;

CREATE POLICY "Admins can view all sales items"
ON public.sales_items
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert sales items"
ON public.sales_items
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update sales items"
ON public.sales_items
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete sales items"
ON public.sales_items
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Adicionar policy de delete para sales
CREATE POLICY "Admins can delete sales"
ON public.sales
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));