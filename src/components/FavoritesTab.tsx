import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image_url: string;
}

export const FavoritesTab = () => {
  const { user } = useAuth();
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const { data: favorites, error: favError } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user?.id);

      if (favError) throw favError;

      if (favorites && favorites.length > 0) {
        const productIds = favorites.map(f => f.product_id);
        
        const { data: products, error: prodError } = await supabase
          .from('products')
          .select('id, name, brand, price, image_url')
          .in('id', productIds)
          .eq('is_active', true);

        if (prodError) throw prodError;
        setFavoriteProducts(products || []);
      } else {
        setFavoriteProducts([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Carregando favoritos...</p>
        </CardContent>
      </Card>
    );
  }

  if (favoriteProducts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Nenhum produto favorito ainda.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Adicione produtos aos favoritos clicando no ícone de coração
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Meus Favoritos</h2>
        <p className="text-muted-foreground">Produtos que você salvou</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {favoriteProducts.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            image={product.image_url || '/placeholder.svg'}
            brand={product.brand || 'Marca'}
            name={product.name}
            price={product.price}
          />
        ))}
      </div>
    </div>
  );
};
