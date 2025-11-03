import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  variants: Array<{
    id: string;
    size: string;
    price: number;
    is_sold_out: boolean;
  }>;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [sortBy, setSortBy] = useState("relevancia");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, selectedBrands, selectedSizes, priceRange, sortBy]);

  const loadProducts = async () => {
    try {
      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

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

      setProducts(productsWithVariants);

      // Extract unique brands and sizes
      const uniqueBrands = [...new Set(productsWithVariants.map(p => p.brand).filter(Boolean))] as string[];
      const uniqueSizes = [...new Set(productsWithVariants.flatMap(p => p.variants.map(v => v.size)))];
      
      setBrands(uniqueBrands.sort());
      setSizes(uniqueSizes.sort());

      // Set max price range
      const maxPrice = Math.max(...productsWithVariants.flatMap(p => p.variants.map(v => v.price)));
      setPriceRange([0, Math.ceil(maxPrice / 100) * 100]);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Filter by brand
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(p => p.brand && selectedBrands.includes(p.brand));
    }

    // Filter by size
    if (selectedSizes.length > 0) {
      filtered = filtered.filter(p => 
        p.variants.some(v => selectedSizes.includes(v.size))
      );
    }

    // Filter by price range
    filtered = filtered.filter(p => {
      const minPrice = Math.min(...p.variants.map(v => v.price));
      return minPrice >= priceRange[0] && minPrice <= priceRange[1];
    });

    // Sort products
    switch (sortBy) {
      case "menor-preco":
        filtered.sort((a, b) => {
          const minA = Math.min(...a.variants.map(v => v.price));
          const minB = Math.min(...b.variants.map(v => v.price));
          return minA - minB;
        });
        break;
      case "maior-preco":
        filtered.sort((a, b) => {
          const minA = Math.min(...a.variants.map(v => v.price));
          const minB = Math.min(...b.variants.map(v => v.price));
          return minB - minA;
        });
        break;
      case "a-z":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "z-a":
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    setFilteredProducts(filtered);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

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
              <Checkbox 
                id={`${brand}-filter`}
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() => toggleBrand(brand)}
              />
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
              <Checkbox 
                id={`${size}-filter`}
                checked={selectedSizes.includes(size)}
                onCheckedChange={() => toggleSize(size)}
              />
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

      <Button 
        className="w-full mt-6 bg-primary hover:bg-primary/90"
        onClick={() => setIsFilterOpen(false)}
      >
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

            {loading ? (
              <p className="text-sm text-muted-foreground mb-4 md:mb-6">
                Carregando produtos...
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4 md:mb-6">
                  {filteredProducts.length} produtos encontrados
                </p>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredProducts.map((product) => {
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

                {filteredProducts.length === 0 && (
                  <p className="text-center text-muted-foreground py-12">
                    Nenhum produto encontrado com os filtros selecionados.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Products;
