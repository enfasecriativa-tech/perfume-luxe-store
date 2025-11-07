-- Garantir que a tabela profiles tenha todos os campos necessários
-- Este SQL é idempotente (pode ser executado múltiplas vezes sem problemas)

-- Adicionar campo CPF se não existir
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Adicionar campo phone se não existir
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Adicionar campo birth_date se não existir  
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Adicionar campo person_type se não existir
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS person_type TEXT DEFAULT 'fisica' CHECK (person_type IN ('fisica', 'juridica'));

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.cpf IS 'CPF do cliente (apenas números)';
COMMENT ON COLUMN public.profiles.phone IS 'Telefone do cliente com DDD';
COMMENT ON COLUMN public.profiles.birth_date IS 'Data de nascimento do cliente';
COMMENT ON COLUMN public.profiles.person_type IS 'Tipo de pessoa: fisica ou juridica';

