import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Helper function to validate UUID
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(data?.map(f => f.product_id) || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (productId: string) => {
    if (!user) {
      toast.error('Faça login para adicionar favoritos');
      return;
    }

    // Validate UUID
    if (!isValidUUID(productId)) {
      toast.error('ID de produto inválido');
      console.error('Invalid product UUID:', productId);
      return;
    }

    setLoading(true);
    try {
      const isFavorited = favorites.includes(productId);

      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (error) throw error;
        setFavorites(prev => prev.filter(id => id !== productId));
        toast.success('Removido dos favoritos');
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            product_id: productId
          });

        if (error) throw error;
        setFavorites(prev => [...prev, productId]);
        toast.success('Adicionado aos favoritos');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar favoritos');
    } finally {
      setLoading(false);
    }
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    loading
  };
};
