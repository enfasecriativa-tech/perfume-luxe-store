-- Make price-related fields nullable in products table since we're now using product_variants
ALTER TABLE public.products 
  ALTER COLUMN price DROP NOT NULL;