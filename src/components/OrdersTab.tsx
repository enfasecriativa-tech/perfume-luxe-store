import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Package, Eye, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderItem {
  id: string;
  product_name: string;
  product_brand: string;
  product_size: string;
  product_image_url: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  shipping_cost: number;
  shipping_method: string | null;
  shipping_days: number | null;
  delivery_zip_code: string | null;
  discount_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  created_at: string;
  sale_date: string;
  items?: OrderItem[];
}

const getStatusInfo = (status: string) => {
  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
    pending: { label: 'Pendente', variant: 'secondary', icon: Clock },
    processing: { label: 'Processando', variant: 'default', icon: Package },
    completed: { label: 'Concluído', variant: 'outline', icon: CheckCircle },
    cancelled: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
    shipped: { label: 'Enviado', variant: 'default', icon: Truck },
  };
  return statusMap[status] || statusMap.pending;
};

const getPaymentStatusInfo = (status: string) => {
  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'Pendente', variant: 'secondary' },
    paid: { label: 'Pago', variant: 'outline' },
    failed: { label: 'Falhou', variant: 'destructive' },
  };
  return statusMap[status] || statusMap.pending;
};

export const OrdersTab = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          items:sales_items(*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Carregando pedidos...</p>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meus Pedidos</CardTitle>
          <CardDescription>Acompanhe seus pedidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Você ainda não fez nenhum pedido.</p>
            <p className="text-sm text-muted-foreground">
              Quando você fizer um pedido, ele aparecerá aqui.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Meus Pedidos</h2>
          <p className="text-muted-foreground">Acompanhe seus pedidos e histórico de compras</p>
        </div>

        <div className="grid gap-4">
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const paymentInfo = getPaymentStatusInfo(order.payment_status);
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg">Pedido #{order.order_number}</h3>
                        <Badge variant={statusInfo.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                        <Badge variant={paymentInfo.variant}>
                          {paymentInfo.label}
                        </Badge>
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          Data: {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                        <p>
                          Total: <span className="font-semibold text-foreground">
                            R$ {order.total_amount.toFixed(2).replace('.', ',')}
                          </span>
                        </p>
                        {order.shipping_method && (
                          <p>
                            Frete: {order.shipping_method} - R$ {order.shipping_cost.toFixed(2).replace('.', ',')}
                            {order.shipping_days && ` (${order.shipping_days} dias úteis)`}
                          </p>
                        )}
                        {order.items && (
                          <p>
                            {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      onClick={() => handleViewDetails(order)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Dialog de Detalhes do Pedido */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              Realizado em {selectedOrder && format(new Date(selectedOrder.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex gap-2">
                <Badge variant={getStatusInfo(selectedOrder.status).variant}>
                  {getStatusInfo(selectedOrder.status).label}
                </Badge>
                <Badge variant={getPaymentStatusInfo(selectedOrder.payment_status).variant}>
                  Pagamento: {getPaymentStatusInfo(selectedOrder.payment_status).label}
                </Badge>
              </div>

              {/* Produtos */}
              <div>
                <h3 className="font-semibold mb-3">Produtos</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 border rounded-lg">
                      <img 
                        src={item.product_image_url || '/placeholder.svg'} 
                        alt={item.product_name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">{item.product_brand}</p>
                        <p className="text-sm text-muted-foreground">Tamanho: {item.product_size}</p>
                        <p className="text-sm">Quantidade: {item.quantity}x</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          R$ {item.subtotal.toFixed(2).replace('.', ',')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          R$ {item.unit_price.toFixed(2).replace('.', ',')} cada
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumo */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Resumo do Pedido</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>R$ {(selectedOrder.total_amount - selectedOrder.shipping_cost + selectedOrder.discount_amount).toFixed(2).replace('.', ',')}</span>
                  </div>
                  {selectedOrder.shipping_cost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Frete ({selectedOrder.shipping_method}):</span>
                      <span>R$ {selectedOrder.shipping_cost.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto:</span>
                      <span>- R$ {selectedOrder.discount_amount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>R$ {selectedOrder.total_amount.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>

              {/* Informações de Entrega */}
              {selectedOrder.delivery_zip_code && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Informações de Entrega</h3>
                  <p className="text-sm">CEP: {selectedOrder.delivery_zip_code}</p>
                  {selectedOrder.shipping_days && (
                    <p className="text-sm">Prazo: {selectedOrder.shipping_days} dias úteis</p>
                  )}
                </div>
              )}

              {/* Método de Pagamento */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Pagamento</h3>
                <p className="text-sm capitalize">{selectedOrder.payment_method}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

