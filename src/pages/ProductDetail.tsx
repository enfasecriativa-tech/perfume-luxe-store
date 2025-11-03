import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, Truck, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";

interface ProductVariant {
  id: string;
  size: string;
  price: number;
  is_sold_out: boolean;
}

interface Product {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  variants: ProductVariant[];
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [zipCode, setZipCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      // Load product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (productError) throw productError;

      // Load variants
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id)
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (variantsError) throw variantsError;

      const productWithVariants: Product = {
        ...productData,
        variants: (variantsData || []).map(v => ({
          id: v.id,
          size: v.size,
          price: v.price,
          is_sold_out: v.is_sold_out || false,
        }))
      };

      setProduct(productWithVariants);
      
      // Select first available variant by default
      const firstAvailable = productWithVariants.variants.find(v => !v.is_sold_out);
      if (firstAvailable) {
        setSelectedVariant(firstAvailable.id);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando produto...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <p className="text-muted-foreground">Produto não encontrado</p>
        </main>
        <Footer />
      </div>
    );
  }

  const selectedVariantData = product.variants.find(v => v.id === selectedVariant);
  const displayPrice = selectedVariantData?.price || product.variants[0]?.price || 0;
  const installments = `ou 4x R$ ${(displayPrice / 4).toFixed(2).replace(".", ",")}`;
  const images = [product.image_url, product.image_url_2, product.image_url_3].filter(Boolean);

  const handleAddToCart = () => {
    if (!selectedVariant || !selectedVariantData) {
      toast.error('Selecione um tamanho');
      return;
    }

    if (selectedVariantData.is_sold_out) {
      toast.error('Este tamanho está esgotado');
      return;
    }

    addToCart({
      productId: product.id,
      variantId: selectedVariant,
      name: product.name,
      brand: product.brand || '',
      size: selectedVariantData.size,
      price: selectedVariantData.price,
      image_url: product.image_url || '/placeholder.svg',
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/carrinho');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-secondary rounded-lg overflow-hidden border border-border">
              <img
                src={images[0] || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.slice(0, 4).map((img, i) => (
                  <button
                    key={i}
                    className="aspect-square bg-secondary rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors"
                  >
                    <img
                      src={img || '/placeholder.svg'}
                      alt={`${product.name} - ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand and Share */}
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                {product.brand || 'Marca'}
              </p>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>

            {/* Product Name */}
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
              {product.name}
            </h1>

            {/* Size Selection */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Selecione o tamanho:</p>
                <div className="flex gap-3 flex-wrap">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => !variant.is_sold_out && setSelectedVariant(variant.id)}
                      disabled={variant.is_sold_out}
                      className={`relative flex-1 min-w-[100px] py-3 px-4 border-2 rounded-lg font-medium text-sm transition-all ${
                        selectedVariant === variant.id
                          ? "border-foreground bg-foreground text-background"
                          : !variant.is_sold_out
                          ? "border-border hover:border-foreground"
                          : "border-border bg-muted text-muted-foreground cursor-not-allowed"
                      }`}
                    >
                      {variant.size}
                      {variant.is_sold_out && (
                        <Badge
                          variant="secondary"
                          className="absolute -top-2 -right-2 bg-muted text-muted-foreground text-xs"
                        >
                          ESGOTADO
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="border-t border-b border-border py-6">
              <p className="text-3xl font-bold text-foreground mb-1">
                R$ {displayPrice.toFixed(2).replace(".", ",")} <span className="text-sm font-normal text-muted-foreground">no PIX</span>
              </p>
              <p className="text-sm text-muted-foreground">{installments}</p>
            </div>

            {/* Shipping Calculator */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Calcule o frete:
              </p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="00000-000"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="flex-1"
                  maxLength={9}
                />
                <Button variant="outline">CALCULAR O FRETE</Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                size="lg"
                onClick={handleAddToCart}
                variant="outline"
                className="w-full h-14 text-lg font-bold"
                disabled={!selectedVariant || product.variants.find(v => v.id === selectedVariant)?.is_sold_out}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                ADICIONAR AO CARRINHO
              </Button>
              <Button
                size="lg"
                onClick={handleBuyNow}
                className="w-full h-14 text-lg font-bold"
                style={{ backgroundColor: '#22c55e' }}
                disabled={!selectedVariant || product.variants.find(v => v.id === selectedVariant)?.is_sold_out}
              >
                COMPRAR AGORA
              </Button>
            </div>

            {/* Security Badge */}
            <p className="text-center text-sm text-success font-semibold">
              🔒 COMPRA 100% SEGURA
            </p>

            {/* Product Description */}
            <div className="border-t border-border pt-6 space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Sobre o Produto</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description || `${product.name} é uma fragrância sofisticada e sedutora. Perfeita para deixar sua marca por onde passa. Ideal para uso diário ou ocasiões especiais.`}
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default ProductDetail;
