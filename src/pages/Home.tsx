import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import heroBanner from "@/assets/hero-banner.jpg";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";

const Home = () => {
  const featuredProducts = [
    {
      id: "1",
      image: product1,
      brand: "Chanel",
      name: "Chanel N°5 Eau de Parfum Feminino",
      price: 899.90,
      installments: "ou 12x de R$ 74,99",
    },
    {
      id: "2",
      image: product2,
      brand: "Dior",
      name: "Miss Dior Eau de Parfum Feminino",
      price: 749.90,
      installments: "ou 12x de R$ 62,49",
    },
    {
      id: "3",
      image: product3,
      brand: "Bleu de Chanel",
      name: "Bleu de Chanel Eau de Toilette Masculino",
      price: 659.90,
      installments: "ou 12x de R$ 54,99",
    },
    {
      id: "4",
      image: product4,
      brand: "Tom Ford",
      name: "Tom Ford Black Orchid Unissex",
      price: 1299.90,
      installments: "ou 12x de R$ 108,32",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative w-full overflow-hidden">
          <div className="relative h-[300px] md:h-[500px] lg:h-[600px]">
            <img
              src={heroBanner}
              alt="Banner Principal"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
              <div className="container mx-auto px-4">
                <div className="max-w-xl space-y-3 md:space-y-4">
                  <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold text-white">
                    Descubra sua
                    <br />
                    <span className="text-primary">Fragrância Perfeita</span>
                  </h1>
                  <p className="text-base md:text-lg text-white/90">
                    Perfumes importados com até 60% de desconto
                  </p>
                  <Link to="/produtos">
                    <Button size="lg" className="bg-primary hover:bg-primary/90">
                      Ver Ofertas
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

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
