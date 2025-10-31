-- Add RLS policies for product-images bucket

-- Policy: Anyone can view product images (public bucket)
create policy "Public Access to Product Images"
on storage.objects for select
using (bucket_id = 'product-images');

-- Policy: Admins can upload product images
create policy "Admins can upload product images"
on storage.objects for insert
with check (
  bucket_id = 'product-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Policy: Admins can update product images
create policy "Admins can update product images"
on storage.objects for update
using (
  bucket_id = 'product-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Policy: Admins can delete product images"
create policy "Admins can delete product images"
on storage.objects for delete
using (
  bucket_id = 'product-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);