import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface StockVariant {
  id: string;
  size: string;
  quantity_in_stock: number;
  min_recommended_quantity: number | null;
  products: { 
    name: string; 
    category: string | null;
  } | null;
}

const AdminStock = () => {
  const [stock, setStock] = useState<StockVariant[]>([]);

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = async () => {
    const { data, error } = await supabase
      .from('product_variants')
      .select('id, size, quantity_in_stock, min_recommended_quantity, products(name, category)')
      .eq('is_active', true)
      .order('quantity_in_stock', { ascending: true });

    if (error) {
      toast.error('Erro ao carregar estoque');
      console.error('Error loading stock:', error);
    } else {
      setStock(data || []);
    }
  };

  const getStockStatus = (quantity: number, minQuantity: number | null) => {
    // Alerta quando estiver perto de 1 unidade ou abaixo do mínimo recomendado
    if (quantity === 0) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Esgotado
      </Badge>;
    }
    if (minQuantity && quantity <= minQuantity) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Baixo
      </Badge>;
    }
    if (quantity <= 1) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Crítico
      </Badge>;
    }
    return <Badge className="bg-primary text-primary-foreground">Normal</Badge>;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Estoque</h1>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Mín. Recomendado</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stock.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhuma variação cadastrada
                </TableCell>
              </TableRow>
            ) : (
              stock.map((item) => (
                <TableRow 
                  key={item.id}
                  className={item.quantity_in_stock <= (item.min_recommended_quantity || 1) ? 'bg-destructive/10' : ''}
                >
                  <TableCell className="font-medium">{item.products?.name || '-'}</TableCell>
                  <TableCell>{item.products?.category || '-'}</TableCell>
                  <TableCell>{item.size || '-'}</TableCell>
                  <TableCell className={item.quantity_in_stock <= (item.min_recommended_quantity || 1) ? 'font-bold text-destructive' : ''}>
                    {item.quantity_in_stock}
                  </TableCell>
                  <TableCell>{item.min_recommended_quantity || '-'}</TableCell>
                  <TableCell>{getStockStatus(item.quantity_in_stock, item.min_recommended_quantity)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminStock;
