-- Add 'staff' value to app_role enum if not exists
do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'app_role'
      and e.enumlabel = 'staff'
  ) then
    alter type public.app_role add value 'staff';
  end if;
end $$;

-- Create function to promote user to staff
create or replace function public.promote_to_staff(user_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
begin
  select id into target_user_id
  from auth.users
  where email = user_email;

  if target_user_id is null then
    raise exception 'User not found';
  end if;

  insert into public.user_roles (user_id, role)
  values (target_user_id, 'staff'::app_role)
  on conflict (user_id, role) do nothing;
end;
$$;

