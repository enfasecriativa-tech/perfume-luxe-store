import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  brand: string;
  size: string;
  price: number;
  quantity: number;
  image_url: string;
}

const CART_STORAGE_KEY = 'shopping-cart';

export const useCart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: Omit<CartItem, 'id' | 'quantity'>) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para adicionar produtos ao carrinho",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    setCartItems(prevItems => {
      const existingItem = prevItems.find(
        i => i.productId === item.productId && i.variantId === item.variantId
      );

      if (existingItem) {
        toast({
          title: "Quantidade atualizada",
          description: `${item.name} - ${item.size}`,
        });
        return prevItems.map(i =>
          i.productId === item.productId && i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      toast({
        title: "Adicionado ao carrinho",
        description: `${item.name} - ${item.size}`,
      });

      return [
        ...prevItems,
        {
          ...item,
          id: `${item.productId}-${item.variantId}`,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + change) }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
    toast({
      title: "Item removido",
      description: "Produto removido do carrinho",
    });
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const getItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return {
    cartItems,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    getItemCount,
    getSubtotal,
  };
};
