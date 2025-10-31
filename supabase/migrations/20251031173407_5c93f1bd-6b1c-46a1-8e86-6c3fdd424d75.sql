-- Create storage bucket for product images
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Add columns for multiple images to products table
alter table products 
add column if not exists image_url_2 text,
add column if not exists image_url_3 text;