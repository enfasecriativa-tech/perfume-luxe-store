-- Add label field to addresses table
ALTER TABLE public.addresses 
ADD COLUMN label text NOT NULL DEFAULT 'Casa';