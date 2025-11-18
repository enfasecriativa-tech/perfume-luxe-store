import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Eye, Trash2, Upload } from 'lucide-react';

interface SaleItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  products: {
    name: string;
    brand: string;
  };
}

interface Sale {
  id: string;
  order_number: string;
  total_amount: number;
  sale_date: string;
  payment_status: string;
  payment_method: string | null;
  status: string;
  notes: string | null;
  payment_proof_url: string | null;
  user_id: string | null;
  shipping_address_id: string | null;
  shipping_cost: number;
  shipping_method: string | null;
  shipping_days: number | null;
  delivery_zip_code: string | null;
  discount_amount: number;
  profiles: { 
    full_name: string; 
    phone: string;
    cpf: string | null;
  } | null;
  user_addresses: { 
    street: string; 
    number: string; 
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
  }[] | null;
}

const AdminSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      // Buscar vendas com dados do perfil
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          profiles(full_name, phone, cpf)
        `)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      // Para cada venda, buscar os endereços do usuário
      const salesWithAddresses = await Promise.all(
        (salesData || []).map(async (sale) => {
          if (sale.user_id) {
            const { data: addresses } = await supabase
              .from('addresses')
              .select('street, number, complement, neighborhood, city, state, zip_code')
              .eq('user_id', sale.user_id);
            
            return {
              ...sale,
              user_addresses: addresses || []
            };
          }
          return {
            ...sale,
            user_addresses: []
          };
        })
      );

      setSales(salesWithAddresses);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      toast.error('Erro ao carregar vendas');
    }
  };

  const loadSaleItems = async (saleId: string) => {
    const { data, error } = await supabase
      .from('sales_items')
      .select('*, products(name, brand)')
      .eq('sale_id', saleId);

    if (error) {
      toast.error('Erro ao carregar itens do pedido');
    } else {
      setSaleItems(data || []);
    }
  };

  const handleViewDetails = async (sale: Sale) => {
    // Recarregar dados completos do pedido incluindo endereços
    try {
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          profiles(full_name, phone, cpf)
        `)
        .eq('id', sale.id)
        .single();

      if (saleError) throw saleError;

      // Buscar endereços do usuário se houver user_id
      let addresses: any[] = [];
      if (saleData.user_id) {
        const { data: addressData } = await supabase
          .from('addresses')
          .select('street, number, complement, neighborhood, city, state, zip_code')
          .eq('user_id', saleData.user_id);
        
        addresses = addressData || [];
      }

      const saleWithAddresses = {
        ...saleData,
        user_addresses: addresses
      };

      setSelectedSale(saleWithAddresses);
      await loadSaleItems(sale.id);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes do pedido:', error);
      toast.error('Erro ao carregar detalhes do pedido');
    }
  };

  const handleUpdateStatus = async (saleId: string, field: string, value: string) => {
    const { error } = await supabase
      .from('sales')
      .update({ [field]: value })
      .eq('id', saleId);

    if (error) {
      toast.error('Erro ao atualizar');
    } else {
      toast.success('Atualizado com sucesso');
      loadSales();
      if (selectedSale?.id === saleId) {
        setSelectedSale({ ...selectedSale, [field]: value });
      }
    }
  };

  const handleUpdateNotes = async (saleId: string, notes: string) => {
    const { error } = await supabase
      .from('sales')
      .update({ notes })
      .eq('id', saleId);

    if (error) {
      toast.error('Erro ao atualizar observações');
    } else {
      toast.success('Observações atualizadas');
      loadSales();
    }
  };

  const handleFileUpload = async (saleId: string, file: File) => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${saleId}-${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      await handleUpdateStatus(saleId, 'payment_proof_url', publicUrl);
    } catch (error) {
      toast.error('Erro ao enviar comprovante');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', saleId);

    if (error) {
      toast.error('Erro ao deletar pedido');
    } else {
      toast.success('Pedido deletado');
      loadSales();
      setIsDetailsOpen(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from('sales_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast.error('Erro ao deletar item');
    } else {
      toast.success('Item deletado');
      if (selectedSale) {
        await loadSaleItems(selectedSale.id);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800',
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      processing: 'Processando',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
      completed: 'Concluído',
    };
    return labels[status] || status;
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      paid: 'Pago',
      failed: 'Falhou',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gerenciamento de Pedidos</h1>
      </div>

      {sales.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Eye className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
              <p className="text-muted-foreground">
                Os pedidos finalizados pelos clientes aparecerão aqui para gerenciamento.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sales.map((sale) => (
            <Card key={sale.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      Pedido #{sale.order_number || sale.id.slice(0, 8)}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(sale.status)}`}>
                      {getStatusLabel(sale.status)}
                    </span>
                  </div>
                  <p className="font-semibold">{sale.profiles?.full_name || 'Cliente não identificado'}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(sale.sale_date), 'dd/MM/yyyy HH:mm')}
                  </p>
                  <p className="text-lg font-bold">R$ {Number(sale.total_amount).toFixed(2)}</p>
                </div>
                <Button onClick={() => handleViewDetails(sale)} variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalhes
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDetailsOpen} modal={true} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{selectedSale?.order_number || selectedSale?.id.slice(0, 8)}</DialogTitle>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-6">
              {/* Dados do Cliente */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Dados do Cliente</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nome</p>
                    <p className="font-medium">{selectedSale.profiles?.full_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Telefone</p>
                    <p className="font-medium">{selectedSale.profiles?.phone || '-'}</p>
                  </div>
                  {selectedSale.profiles?.cpf && (
                    <div>
                      <p className="text-muted-foreground">CPF</p>
                      <p className="font-medium">{selectedSale.profiles.cpf}</p>
                    </div>
                  )}
                </div>

                {/* Endereços Cadastrados */}
                {selectedSale.user_addresses && selectedSale.user_addresses.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2 text-sm">Endereços Cadastrados:</h4>
                    {selectedSale.user_addresses.map((address, index) => (
                      <div key={index} className="text-sm mb-2 p-2 bg-muted rounded">
                        {address.street}, {address.number}
                        {address.complement && ` - ${address.complement}`}
                        <br />
                        {address.neighborhood} - {address.city}/{address.state}
                        <br />
                        CEP: {address.zip_code}
                      </div>
                    ))}
                  </div>
                )}

                {/* CEP de Entrega do Pedido */}
                {selectedSale.delivery_zip_code && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2 text-sm">CEP para Entrega deste Pedido:</h4>
                    <p className="text-sm">{selectedSale.delivery_zip_code}</p>
                    {selectedSale.shipping_method && (
                      <p className="text-sm mt-1">
                        Frete: {selectedSale.shipping_method} - R$ {selectedSale.shipping_cost.toFixed(2).replace('.', ',')}
                        {selectedSale.shipping_days && ` (${selectedSale.shipping_days} dias úteis)`}
                      </p>
                    )}
                  </div>
                )}
              </Card>

              {/* Produtos */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Produtos</h3>
                <div className="space-y-3">
                  {saleItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{item.products.name}</p>
                        <p className="text-sm text-muted-foreground">{item.products.brand}</p>
                        <p className="text-sm">Qtd: {item.quantity} x R$ {Number(item.unit_price).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold">R$ {Number(item.subtotal).toFixed(2)}</p>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deletar Item</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover este item do pedido?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Status e Pagamento */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Status e Pagamento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Status do Pedido</Label>
                    <Select
                      value={selectedSale.status}
                      onValueChange={(value) => handleUpdateStatus(selectedSale.id, 'status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="processing">Processando</SelectItem>
                        <SelectItem value="shipped">Enviado</SelectItem>
                        <SelectItem value="delivered">Entregue</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status de Pagamento</Label>
                    <Select
                      value={selectedSale.payment_status || 'pending'}
                      onValueChange={(value) => handleUpdateStatus(selectedSale.id, 'payment_status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Método de Pagamento</Label>
                    <Select
                      value={selectedSale.payment_method || ''}
                      onValueChange={(value) => handleUpdateStatus(selectedSale.id, 'payment_method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                        <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="transfer">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Comprovante de Pagamento</Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(selectedSale.id, file);
                        }}
                        disabled={isUploading}
                      />
                      {selectedSale.payment_proof_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(selectedSale.payment_proof_url!, '_blank')}
                        >
                          Ver
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Observações */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Observações</h3>
                <Textarea
                  placeholder="Adicione observações sobre este pedido..."
                  value={selectedSale.notes || ''}
                  onChange={(e) => setSelectedSale({ ...selectedSale, notes: e.target.value })}
                  rows={4}
                />
                <Button
                  className="mt-3"
                  onClick={() => handleUpdateNotes(selectedSale.id, selectedSale.notes || '')}
                >
                  Salvar Observações
                </Button>
              </Card>

              {/* Deletar Pedido */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deletar Pedido Completo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deletar Pedido</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja deletar este pedido completamente? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteSale(selectedSale.id)}>
                      Deletar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSales;
