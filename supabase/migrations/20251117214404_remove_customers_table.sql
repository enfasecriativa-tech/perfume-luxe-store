-- Remover a tabela customers e todas as suas dependências

-- 1. Remover a foreign key constraint de sales.customer_id
ALTER TABLE public.sales
DROP CONSTRAINT IF EXISTS sales_customer_id_fkey;

-- 2. Remover as políticas RLS da tabela customers
DROP POLICY IF EXISTS "Admins can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can update customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can delete customers" ON public.customers;

-- 3. Remover o trigger de updated_at
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;

-- 4. Remover a tabela customers
DROP TABLE IF EXISTS public.customers;

