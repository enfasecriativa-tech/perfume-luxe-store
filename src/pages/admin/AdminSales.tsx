import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Sale {
  id: string;
  total_amount: number;
  sale_date: string;
  payment_status: string;
  payment_method: string | null;
  customer_id: string | null;
  customers: { name: string } | null;
}

const AdminSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('*, customers(name)')
      .order('sale_date', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar vendas');
    } else {
      setSales(data || []);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Vendas</h1>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>{format(new Date(sale.sale_date), 'dd/MM/yyyy HH:mm')}</TableCell>
                <TableCell>{sale.customers?.name || '-'}</TableCell>
                <TableCell>R$ {Number(sale.total_amount).toFixed(2)}</TableCell>
                <TableCell>{sale.payment_method || '-'}</TableCell>
                <TableCell>{sale.payment_status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminSales;
