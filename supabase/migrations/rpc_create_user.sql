-- Create extension for password hashing if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create RPC function to create user and assign role
CREATE OR REPLACE FUNCTION public.create_user_with_role(
    email text,
    password text,
    full_name text,
    role_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_user_id uuid;
    encrypted_pw text;
    valid_role public.app_role;
BEGIN
    -- Check if requester is admin
    -- Note: We check if the executing user has the 'admin' role in user_roles table
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RETURN json_build_object('ok', false, 'error', 'Permissão negada: Apenas administradores podem criar usuários.');
    END IF;

    -- Validate role input
    BEGIN
        valid_role := role_name::public.app_role;
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object('ok', false, 'error', 'Função inválida. Use "admin" ou "staff" (mapeado para user).');
    END;

    -- Check if user exists in auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE auth.users.email = create_user_with_role.email) THEN
        RETURN json_build_object('ok', false, 'error', 'Usuário já existe.');
    END IF;

    -- Generate UUID and password hash
    new_user_id := gen_random_uuid();
    encrypted_pw := crypt(password, gen_salt('bf'));

    -- Insert into auth.users
    -- We must ensure we provide all necessary fields for a valid user
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        email,
        encrypted_pw,
        now(),
        '{"provider": "email", "providers": ["email"]}',
        json_build_object('full_name', full_name),
        now(),
        now(),
        '',
        ''
    );

    -- Insert into public.profiles
    -- Handle conflict just in case, though unrelated for new UUID
    INSERT INTO public.profiles (id, full_name)
    VALUES (new_user_id, full_name)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- Insert into user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, valid_role);

    RETURN json_build_object('ok', true, 'userId', new_user_id);

EXCEPTION WHEN OTHERS THEN
    -- Capture any other error
    RETURN json_build_object('ok', false, 'error', SQLERRM);
END;
$$;
