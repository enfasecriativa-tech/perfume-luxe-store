-- Criar tabela de banners para a página inicial
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  button_link TEXT,
  button_text TEXT DEFAULT 'Ver Ofertas',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Qualquer pessoa pode ver banners ativos
CREATE POLICY "Anyone can view active banners"
ON public.banners
FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem inserir banners
CREATE POLICY "Admins can insert banners"
ON public.banners
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem atualizar banners
CREATE POLICY "Admins can update banners"
ON public.banners
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem deletar banners
CREATE POLICY "Admins can delete banners"
ON public.banners
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_banners_updated_at
BEFORE UPDATE ON public.banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON public.banners(display_order);
CREATE INDEX IF NOT EXISTS idx_banners_created_at ON public.banners(created_at DESC);

-- Comentários para documentação
COMMENT ON TABLE public.banners IS 'Banners do hero da página inicial';
COMMENT ON COLUMN public.banners.image_url IS 'URL da imagem do banner (recomendado: 1920x600px, 72dpi)';
COMMENT ON COLUMN public.banners.title IS 'Título principal do banner';
COMMENT ON COLUMN public.banners.description IS 'Descrição opcional em poucas palavras';
COMMENT ON COLUMN public.banners.button_link IS 'Link do botão (produto, categoria ou promoção)';
COMMENT ON COLUMN public.banners.button_text IS 'Texto do botão de ação';
COMMENT ON COLUMN public.banners.display_order IS 'Ordem de exibição (menor valor = primeiro)';
COMMENT ON COLUMN public.banners.is_active IS 'Se o banner está ativo e visível';

-- Inserir banner de exemplo (opcional)
INSERT INTO public.banners (title, description, image_url, button_link, button_text, display_order, is_active)
VALUES (
  'Descubra sua Fragrância Perfeita',
  'Perfumes importados com até 60% de desconto',
  '/hero-banner.jpg',
  '/produtos',
  'Ver Ofertas',
  1,
  true
)
ON CONFLICT DO NOTHING;

