import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.jpg";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string | null;
  image_url: string | null;
  variants: Array<{
    id: string;
    size: string;
    price: number;
    is_sold_out: boolean;
  }>;
}

interface Banner {
  id: string;
  image_url: string;
  title: string;
  description: string | null;
  button_link: string | null;
  button_text: string;
  display_order: number;
}

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
    loadBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000); // Muda a cada 5 segundos

      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const loadBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error loading banners:', error);
    }
  };

  const loadFeaturedProducts = async () => {
    try {
      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(4);

      if (productsError) throw productsError;

      // Load variants for all products
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('is_active', true);

      if (variantsError) throw variantsError;

      // Combine products with their variants
      const productsWithVariants: Product[] = (productsData || []).map(product => ({
        ...product,
        variants: (variantsData || [])
          .filter(v => v.product_id === product.id)
          .map(v => ({
            id: v.id,
            size: v.size,
            price: v.price,
            is_sold_out: v.is_sold_out || false,
          }))
          .sort((a, b) => a.price - b.price)
      })).filter(p => p.variants.length > 0);

      setFeaturedProducts(productsWithVariants);
    } catch (error) {
      console.error('Error loading featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  };

  const previousBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const currentBanner = banners[currentBannerIndex];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Banner Carousel */}
        <section className="relative w-full overflow-hidden">
          <div className="relative h-[300px] md:h-[500px] lg:h-[600px]">
            {/* Banner Image */}
            <img
              src={currentBanner?.image_url || heroBanner}
              alt={currentBanner?.title || "Banner Principal"}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
            
            {/* Overlay and Content */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
              <div className="container mx-auto px-4">
                <div className="max-w-xl space-y-3 md:space-y-4">
                  <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold text-white">
                    {currentBanner?.title || "Descubra sua"}
                    {!currentBanner && (
                      <>
                        <br />
                        <span className="text-primary">Fragrância Perfeita</span>
                      </>
                    )}
                  </h1>
                  {(currentBanner?.description || !currentBanner) && (
                    <p className="text-base md:text-lg text-white/90">
                      {currentBanner?.description || "Perfumes importados com até 60% de desconto"}
                    </p>
                  )}
                  {(currentBanner?.button_link || !currentBanner) && (
                    <Link to={currentBanner?.button_link || "/produtos"}>
                      <Button size="lg" className="bg-primary hover:bg-primary/90">
                        {currentBanner?.button_text || "Ver Ofertas"}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Arrows */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={previousBanner}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-all"
                  aria-label="Banner anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextBanner}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 rounded-full transition-all"
                  aria-label="Próximo banner"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Dots Indicator */}
            {banners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBannerIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentBannerIndex
                        ? 'bg-white w-8'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Ir para banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Featured Products */}
        <section className="container mx-auto px-4 py-8 md:py-16">
          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Produtos Selecionados
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Os perfumes mais desejados do momento
            </p>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground">Carregando produtos...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => {
                const minPrice = Math.min(...product.variants.map(v => v.price));
                const installments = `ou 12x de R$ ${(minPrice / 12).toFixed(2).replace(".", ",")}`;
                
                return (
                  <ProductCard 
                    key={product.id}
                    id={product.id}
                    image={product.image_url || '/placeholder.svg'}
                    brand={product.brand || 'Marca'}
                    name={product.name}
                    price={minPrice}
                    installments={installments}
                  />
                );
              })}
            </div>
          )}

          <div className="mt-8 md:mt-12 text-center">
            <Link to="/produtos">
              <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                Ver Todos os Produtos
              </Button>
            </Link>
          </div>
        </section>

        {/* Categories Section */}
        <section className="bg-secondary py-8 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 md:mb-8 text-center">
              Categorias em Destaque
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {["Perfumes Femininos", "Perfumes Masculinos", "Maquiagem", "Cosméticos"].map(
                (category) => (
                  <Link
                    key={category}
                    to="/produtos"
                    className="group bg-background border border-border rounded-lg p-6 text-center hover:border-primary hover:shadow-md transition-all"
                  >
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {category}
                    </h3>
                  </Link>
                )
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Home;
