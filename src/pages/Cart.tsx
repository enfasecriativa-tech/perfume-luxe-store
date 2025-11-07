import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Minus, Plus, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ShippingOption {
  name: string;
  price: number;
  delivery_time: number;
}

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeItem, getSubtotal, clearCart } = useCart();
  const [cep, setCep] = useState('');
  const [coupon, setCoupon] = useState('');
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<{
    cheapest: ShippingOption;
    fastest: ShippingOption;
  } | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);

  const subtotal: number = getSubtotal();
  const shipping: number = selectedShipping && selectedShipping.price != null ? selectedShipping.price : 0;
  const discount: number = 0;
  const total: number = subtotal + shipping - discount;

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Faça login para finalizar sua compra');
      navigate('/auth');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }

    try {
      // Buscar o número do WhatsApp das configurações
      const { data: settings, error: settingsError } = await supabase
        .from('store_settings')
        .select('value')
        .eq('key', 'whatsapp_number')
        .single();

      if (settingsError || !settings?.value) {
        toast.error('Número do WhatsApp não configurado. Entre em contato com o suporte.');
        return;
      }

      const whatsappNumber = settings.value.replace(/\D/g, ''); // Remove caracteres não numéricos

      // 1. Criar o pedido no banco de dados
      const { data: orderData, error: orderError } = await supabase
        .from('sales')
        .insert({
          user_id: user.id,
          total_amount: total,
          shipping_cost: shipping,
          shipping_method: selectedShipping?.name || null,
          shipping_days: selectedShipping?.delivery_time || null,
          delivery_zip_code: cep || null,
          discount_amount: discount,
          payment_method: 'whatsapp',
          payment_status: 'pending',
          status: 'pending',
          whatsapp_sent: true,
          notes: 'Pedido via WhatsApp'
        })
        .select()
        .single();

      if (orderError) {
        console.error('Erro ao criar pedido:', orderError);
        toast.error('Erro ao registrar pedido. Tente novamente.');
        return;
      }

      // 2. Criar os itens do pedido
      const orderItems = cartItems.map(item => ({
        sale_id: orderData.id,
        product_id: item.productId,
        variant_id: item.variantId,
        product_name: item.name,
        product_brand: item.brand,
        product_size: item.size,
        product_image_url: item.image_url,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('sales_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Erro ao criar itens do pedido:', itemsError);
        // Deletar o pedido criado se houver erro nos itens
        await supabase.from('sales').delete().eq('id', orderData.id);
        toast.error('Erro ao registrar itens do pedido. Tente novamente.');
        return;
      }

      // 3. Montar a mensagem do WhatsApp
      let message = `🛍️ *Novo Pedido #${orderData.order_number}*\n\n`;
      message += '*Produtos:*\n';
      
      cartItems.forEach((item, index) => {
        message += `\n${index + 1}. ${item.name}\n`;
        message += `   Marca: ${item.brand}\n`;
        message += `   Tamanho: ${item.size}\n`;
        message += `   Quantidade: ${item.quantity}x\n`;
        message += `   Preço unitário: R$ ${item.price.toFixed(2).replace('.', ',')}\n`;
        message += `   Subtotal: R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}\n`;
      });

      message += `\n*Resumo do Pedido:*\n`;
      message += `Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')}\n`;
      
      if (shipping > 0) {
        message += `Frete (${selectedShipping?.name}): R$ ${shipping.toFixed(2).replace('.', ',')}\n`;
        message += `Prazo: ${selectedShipping?.delivery_time} dias úteis\n`;
      } else {
        message += `Frete: A calcular\n`;
      }
      
      if (discount > 0) {
        message += `Desconto: R$ ${discount.toFixed(2).replace('.', ',')}\n`;
      }
      
      message += `*TOTAL: R$ ${total.toFixed(2).replace('.', ',')}*\n\n`;
      
      if (cep) {
        message += `CEP para entrega: ${cep}\n\n`;
      }
      
      message += `📦 Número do Pedido: *${orderData.order_number}*\n\n`;
      message += 'Gostaria de finalizar este pedido! 😊';

      // 4. Codificar a mensagem para URL
      const encodedMessage = encodeURIComponent(message);
      
      // 5. Criar o link do WhatsApp
      const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
      
      // 6. Abrir o WhatsApp em uma nova aba
      window.open(whatsappLink, '_blank');
      
      // 7. Limpar o carrinho após sucesso
      // clearCart(); // Descomente se quiser limpar o carrinho automaticamente
      
      toast.success(`Pedido #${orderData.order_number} registrado! Redirecionando para o WhatsApp...`);
      
    } catch (error) {
      console.error('Erro ao processar checkout:', error);
      toast.error('Erro ao processar pedido. Tente novamente.');
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) {
      value = `${value.slice(0, 5)}-${value.slice(5)}`;
    }
    setCep(value);
  };

  const handleCalculateShipping = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      toast.error('Digite um CEP válido com 8 dígitos');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Carrinho vazio');
      return;
    }

    setCalculatingShipping(true);
    setShippingOptions(null);
    setSelectedShipping(null);

    try {
      // Para simplificar, vamos calcular o frete usando o primeiro produto do carrinho
      // Em uma implementação real, você pode querer calcular para todos os produtos
      const firstProduct = cartItems[0];
      
      console.log('Calculando frete para produto:', firstProduct.productId);
      
      const { data, error } = await supabase.functions.invoke('calculate-shipping', {
        body: {
          cep: cleanCep,
          product_id: firstProduct.productId
        }
      });

      console.log('Resposta da função:', { data, error });

      if (error) {
        console.error('Erro da Edge Function:', error);
        toast.error(error.message || 'Erro ao calcular frete');
        return;
      }

      if (data?.error) {
        console.error('Erro retornado pela API:', data.error);
        toast.error(data.error);
        return;
      }

      if (!data?.cheapest) {
        toast.error('Nenhuma opção de frete disponível');
        return;
      }

      setShippingOptions({
        cheapest: data.cheapest,
        fastest: data.fastest || data.cheapest
      });

      // Seleciona automaticamente a opção mais barata
      setSelectedShipping(data.cheapest);

      toast.success('Frete calculado com sucesso!');
    } catch (error) {
      console.error('Error calculating shipping:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao calcular frete. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setCalculatingShipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Link
          to="/produtos"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          continuar comprando
        </Link>

        {cartItems.length === 0 ? (
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Seu carrinho está vazio</h2>
            <p className="text-muted-foreground mb-6">
              Adicione produtos para começar suas compras
            </p>
            <Link to="/produtos">
              <Button>Ir para Produtos</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4 pb-4 border-b text-sm font-medium text-muted-foreground">
                    <div className="col-span-5">ITEM</div>
                    <div className="col-span-3 text-center">QUANTIDADE</div>
                    <div className="col-span-3 text-right">SUBTOTAL</div>
                    <div className="col-span-1"></div>
                  </div>

                  {cartItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 py-4 border-b items-center">
                      <div className="col-span-5 flex gap-4">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.brand} - {item.size}</p>
                        </div>
                      </div>
                      <div className="col-span-3 flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="col-span-3 text-right font-medium">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Remover item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Digite seu CEP"
                      value={cep}
                      onChange={handleCepChange}
                      maxLength={9}
                      disabled={calculatingShipping}
                    />
                    <Button 
                      variant="destructive" 
                      onClick={handleCalculateShipping}
                      disabled={calculatingShipping}
                    >
                      {calculatingShipping ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Calculando...
                        </>
                      ) : (
                        'CALCULAR'
                      )}
                    </Button>
                  </div>

                  {shippingOptions && shippingOptions.cheapest && shippingOptions.cheapest.price != null && (
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium">Opções de frete:</p>
                      <div 
                        className={`p-2 rounded cursor-pointer border ${
                          selectedShipping?.name === shippingOptions.cheapest.name 
                            ? 'border-primary bg-primary/10' 
                            : 'border-transparent hover:bg-muted'
                        }`}
                        onClick={() => setSelectedShipping(shippingOptions.cheapest)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">{shippingOptions.cheapest.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Entrega em {shippingOptions.cheapest.delivery_time} dias úteis
                            </p>
                          </div>
                          <p className="text-sm font-bold">
                            R$ {shippingOptions.cheapest.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {shippingOptions.fastest && shippingOptions.fastest.price != null && shippingOptions.fastest.name !== shippingOptions.cheapest.name && (
                        <div 
                          className={`p-2 rounded cursor-pointer border ${
                            selectedShipping?.name === shippingOptions.fastest.name 
                              ? 'border-primary bg-primary/10' 
                              : 'border-transparent hover:bg-muted'
                          }`}
                          onClick={() => setSelectedShipping(shippingOptions.fastest)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium">{shippingOptions.fastest.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Entrega em {shippingOptions.fastest.delivery_time} dias úteis
                              </p>
                            </div>
                            <p className="text-sm font-bold">
                              R$ {shippingOptions.fastest.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Digite seu cupom"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                    />
                    <Button variant="default">APLICAR</Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">RESUMO DO PEDIDO</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frete</span>
                    <span>{shipping === 0 ? '-' : `R$ ${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cupom</span>
                    <span>R$ {discount.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>TOTAL</span>
                      <span>R$ {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/produtos">Continuar comprando</Link>
                  </Button>
                  <Button 
                    className="w-full" 
                    style={{ backgroundColor: '#22c55e' }}
                    onClick={handleCheckout}
                    disabled={cartItems.length === 0}
                  >
                    Finalizar compra
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
