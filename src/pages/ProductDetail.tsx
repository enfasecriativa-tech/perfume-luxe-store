import { useState } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import product1 from "@/assets/product-1.jpg";

const ProductDetail = () => {
  const { id } = useParams();
  const [selectedSize, setSelectedSize] = useState("200ml");
  const [zipCode, setZipCode] = useState("");

  const sizes = [
    { value: "50ml", label: "50 ML", available: false },
    { value: "100ml", label: "100 ML", available: false },
    { value: "200ml", label: "200 ML", available: true },
  ];

  const product = {
    id: id || "1",
    brand: "Antonio Banderas",
    name: "King Of Seduction Masculino Eau de Toilette",
    image: product1,
    price: 180.89,
    installments: "ou 4x R$ 45,22",
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
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <button
                  key={i}
                  className="aspect-square bg-secondary rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors"
                >
                  <img
                    src={product.image}
                    alt={`${product.name} - ${i}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand and Share */}
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                {product.brand}
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
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Selecione o tamanho:</p>
              <div className="flex gap-3">
                {sizes.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => size.available && setSelectedSize(size.value)}
                    disabled={!size.available}
                    className={`relative flex-1 py-3 px-4 border-2 rounded-lg font-medium text-sm transition-all ${
                      selectedSize === size.value
                        ? "border-foreground bg-foreground text-background"
                        : size.available
                        ? "border-border hover:border-foreground"
                        : "border-border bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    {size.label}
                    {!size.available && (
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

            {/* Price */}
            <div className="border-t border-b border-border py-6">
              <p className="text-3xl font-bold text-foreground mb-1">
                R$ {product.price.toFixed(2).replace(".", ",")} <span className="text-sm font-normal text-muted-foreground">no PIX</span>
              </p>
              <p className="text-sm text-muted-foreground">{product.installments}</p>
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

            {/* Buy Button */}
            <Button
              size="lg"
              className="w-full h-14 text-lg font-bold bg-success hover:bg-success/90"
            >
              COMPRAR
            </Button>

            {/* Security Badge */}
            <p className="text-center text-sm text-success font-semibold">
              🔒 COMPRA 100% SEGURA
            </p>

            {/* Product Description */}
            <div className="border-t border-border pt-6 space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Sobre o Produto</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.name} é uma fragrância masculina sofisticada e sedutora. Com notas de bergamota, 
                lavanda e âmbar, este perfume é perfeito para o homem moderno que busca deixar sua marca 
                por onde passa. Ideal para uso diário ou ocasiões especiais.
              </p>
              <div className="space-y-2 text-sm">
                <p className="text-foreground"><strong>Tipo:</strong> Eau de Toilette</p>
                <p className="text-foreground"><strong>Gênero:</strong> Masculino</p>
                <p className="text-foreground"><strong>Família Olfativa:</strong> Oriental</p>
              </div>
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
