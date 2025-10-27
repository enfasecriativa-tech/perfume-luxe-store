-- Create app_role enum
create type public.app_role as enum ('admin', 'user');

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamp with time zone default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- RLS policies for user_roles
create policy "Users can view their own roles"
on public.user_roles
for select
using (auth.uid() = user_id);

create policy "Admins can view all roles"
on public.user_roles
for select
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert roles"
on public.user_roles
for insert
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete roles"
on public.user_roles
for delete
using (public.has_role(auth.uid(), 'admin'));

-- Create products table
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price decimal(10,2) not null,
  cost_price decimal(10,2),
  category text,
  brand text,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.products enable row level security;

-- RLS policies for products
create policy "Anyone can view active products"
on public.products
for select
using (is_active = true or public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert products"
on public.products
for insert
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update products"
on public.products
for update
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete products"
on public.products
for delete
using (public.has_role(auth.uid(), 'admin'));

-- Create customers table
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  cpf text,
  address text,
  city text,
  state text,
  zip_code text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.customers enable row level security;

-- RLS policies for customers
create policy "Admins can view all customers"
on public.customers
for select
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert customers"
on public.customers
for insert
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update customers"
on public.customers
for update
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete customers"
on public.customers
for delete
using (public.has_role(auth.uid(), 'admin'));

-- Create stock table
create table public.stock (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer not null default 0,
  min_quantity integer default 0,
  location text,
  updated_at timestamp with time zone default now(),
  unique(product_id)
);

alter table public.stock enable row level security;

-- RLS policies for stock
create policy "Admins can view stock"
on public.stock
for select
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert stock"
on public.stock
for insert
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update stock"
on public.stock
for update
using (public.has_role(auth.uid(), 'admin'));

-- Create sales table
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  total_amount decimal(10,2) not null,
  payment_method text,
  payment_status text default 'pending',
  notes text,
  sale_date timestamp with time zone default now(),
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

alter table public.sales enable row level security;

-- RLS policies for sales
create policy "Admins can view all sales"
on public.sales
for select
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert sales"
on public.sales
for insert
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update sales"
on public.sales
for update
using (public.has_role(auth.uid(), 'admin'));

-- Create sales_items table
create table public.sales_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.sales(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete restrict not null,
  quantity integer not null,
  unit_price decimal(10,2) not null,
  subtotal decimal(10,2) not null,
  created_at timestamp with time zone default now()
);

alter table public.sales_items enable row level security;

-- RLS policies for sales_items
create policy "Admins can view all sales items"
on public.sales_items
for select
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert sales items"
on public.sales_items
for insert
with check (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updating updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_products_updated_at
before update on public.products
for each row
execute function public.update_updated_at_column();

create trigger update_customers_updated_at
before update on public.customers
for each row
execute function public.update_updated_at_column();

create trigger update_stock_updated_at
before update on public.stock
for each row
execute function public.update_updated_at_column();