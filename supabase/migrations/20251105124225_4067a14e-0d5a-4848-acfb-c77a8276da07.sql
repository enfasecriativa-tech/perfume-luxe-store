-- Add shipping dimensions and weight to products table
ALTER TABLE public.products
ADD COLUMN height NUMERIC,
ADD COLUMN width NUMERIC,
ADD COLUMN length NUMERIC,
ADD COLUMN weight NUMERIC;

COMMENT ON COLUMN public.products.height IS 'Altura do produto em cm';
COMMENT ON COLUMN public.products.width IS 'Largura do produto em cm';
COMMENT ON COLUMN public.products.length IS 'Comprimento do produto em cm';
COMMENT ON COLUMN public.products.weight IS 'Peso do produto em kg';