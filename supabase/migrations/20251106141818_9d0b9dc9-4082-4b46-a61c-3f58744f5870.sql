-- Create store_settings table for managing store configurations
CREATE TABLE public.store_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all settings"
  ON public.store_settings
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert settings"
  ON public.store_settings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update settings"
  ON public.store_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete settings"
  ON public.store_settings
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow public read access for whatsapp number (so customers can see it)
CREATE POLICY "Anyone can view whatsapp number"
  ON public.store_settings
  FOR SELECT
  USING (key = 'whatsapp_number');

-- Create trigger for updated_at
CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default WhatsApp number setting
INSERT INTO public.store_settings (key, value, description)
VALUES ('whatsapp_number', '', 'Número do WhatsApp para atendimento e pedidos')
ON CONFLICT (key) DO NOTHING;