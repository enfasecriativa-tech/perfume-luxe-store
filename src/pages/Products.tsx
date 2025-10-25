import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";

const Products = () => {
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [sortBy, setSortBy] = useState("relevancia");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const products = [
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
    {
      id: "5",
      image: product1,
      brand: "Versace",
      name: "Versace Eros Eau de Toilette Masculino",
      price: 489.90,
      installments: "ou 12x de R$ 40,82",
    },
    {
      id: "6",
      image: product2,
      brand: "Carolina Herrera",
      name: "Good Girl Eau de Parfum Feminino",
      price: 699.90,
      installments: "ou 12x de R$ 58,32",
    },
  ];

  const brands = ["Chanel", "Dior", "Tom Ford", "Versace", "Carolina Herrera", "Bleu de Chanel"];
  const sizes = ["30 ML", "50 ML", "100 ML", "200 ML"];

  const sortOptions = [
    { value: "relevancia", label: "Relevância" },
    { value: "maior-preco", label: "Maior preço" },
    { value: "menor-preco", label: "Menor Preço" },
    { value: "a-z", label: "A-Z" },
    { value: "z-a", label: "Z-A" },
  ];

  // Filter content component
  const FilterContent = () => (
    <>
      <h2 className="text-lg font-bold text-foreground mb-6">FILTRAR POR</h2>

      {/* Brand Filter */}
      <Collapsible defaultOpen className="mb-6">
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors">
          MARCA
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-3">
          {brands.map((brand) => (
            <div key={brand} className="flex items-center space-x-2">
              <Checkbox id={`${brand}-filter`} />
              <label
                htmlFor={`${brand}-filter`}
                className="text-sm text-foreground cursor-pointer hover:text-primary transition-colors"
              >
                {brand}
              </label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Price Filter */}
      <Collapsible defaultOpen className="mb-6">
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors">
          PREÇO
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={2000}
            step={50}
            className="mb-4"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>R$ {priceRange[0]}</span>
            <span>R$ {priceRange[1]}</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Size Filter */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors">
          TAMANHO
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-3">
          {sizes.map((size) => (
            <div key={size} className="flex items-center space-x-2">
              <Checkbox id={`${size}-filter`} />
              <label
                htmlFor={`${size}-filter`}
                className="text-sm text-foreground cursor-pointer hover:text-primary transition-colors"
              >
                {size}
              </label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Button className="w-full mt-6 bg-primary hover:bg-primary/90">
        Aplicar Filtros
      </Button>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-background border border-border rounded-lg p-6 sticky top-24">
              <FilterContent />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Mobile Filter Button + Sort Options */}
            <div className="mb-4 md:mb-6 space-y-4">
              {/* Mobile Filter Button */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full lg:hidden gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtros
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] bg-background overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort Options */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border-b border-border pb-4">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Ordenar por:</span>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={sortBy === option.value ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSortBy(option.value)}
                      className={sortBy === option.value ? "bg-primary" : ""}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4 md:mb-6">
              {products.length} produtos encontrados
            </p>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Products;
