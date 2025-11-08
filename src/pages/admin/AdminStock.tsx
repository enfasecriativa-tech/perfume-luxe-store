import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Stock {
  id: string;
  quantity: number;
  min_quantity: number | null;
  location: string | null;
  products: { name: string; category: string | null } | null;
}

const AdminStock = () => {
  const [stock, setStock] = useState<Stock[]>([]);

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = async () => {
    const { data, error } = await supabase
      .from('stock')
      .select('*, products(name, category)')
      .order('quantity', { ascending: true });

    if (error) {
      toast.error('Erro ao carregar estoque');
    } else {
      setStock(data || []);
    }
  };

  const getStockStatus = (quantity: number, minQuantity: number | null) => {
    if (minQuantity && quantity <= minQuantity) {
      return <Badge variant="destructive">Baixo</Badge>;
    }
    if (quantity === 0) {
      return <Badge variant="destructive">Esgotado</Badge>;
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
              <TableHead>Quantidade</TableHead>
              <TableHead>Mín. Recomendado</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stock.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.products?.name || '-'}</TableCell>
                <TableCell>{item.products?.category || '-'}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.min_quantity || '-'}</TableCell>
                <TableCell>{item.location || '-'}</TableCell>
                <TableCell>{getStockStatus(item.quantity, item.min_quantity)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminStock;
