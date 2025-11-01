-- Create product_variants table to support multiple sizes per product
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  cost_price_usd NUMERIC,
  cost_price NUMERIC,
  price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on product_variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Create policies for product_variants
CREATE POLICY "Anyone can view active variants"
  ON public.product_variants
  FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert variants"
  ON public.product_variants
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update variants"
  ON public.product_variants
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete variants"
  ON public.product_variants
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updating updated_at
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing products: create variants from existing product data
INSERT INTO public.product_variants (product_id, size, cost_price_usd, cost_price, price, is_active)
SELECT 
  id as product_id,
  COALESCE(size, 'Tamanho único') as size,
  cost_price_usd,
  cost_price,
  price,
  is_active
FROM public.products
WHERE price IS NOT NULL;

-- Remove price-related fields from products table (keep them for now for backward compatibility)
-- We'll phase them out gradually
COMMENT ON COLUMN public.products.price IS 'DEPRECATED: Use product_variants table instead';
COMMENT ON COLUMN public.products.cost_price IS 'DEPRECATED: Use product_variants table instead';
COMMENT ON COLUMN public.products.cost_price_usd IS 'DEPRECATED: Use product_variants table instead';
COMMENT ON COLUMN public.products.size IS 'DEPRECATED: Use product_variants table instead';