-- Adiciona role de admin para o usuário existente
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'gestormkt.alexandre@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Cria uma função para promover usuários a admin (útil para o futuro)
CREATE OR REPLACE FUNCTION public.promote_to_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;