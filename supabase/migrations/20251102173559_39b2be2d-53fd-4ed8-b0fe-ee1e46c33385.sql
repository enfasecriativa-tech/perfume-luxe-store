-- Add is_sold_out column to product_variants table
ALTER TABLE public.product_variants 
ADD COLUMN is_sold_out boolean DEFAULT false NOT NULL;