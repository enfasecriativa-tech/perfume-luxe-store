import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Users, ShoppingCart, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    products: 0,
    customers: 0,
    sales: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const [productsRes, customersRes, salesRes] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('sales').select('total_amount'),
    ]);

    const totalRevenue = salesRes.data?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;

    setStats({
      products: productsRes.count || 0,
      customers: customersRes.count || 0,
      sales: salesRes.data?.length || 0,
      revenue: totalRevenue,
    });
  };

  const cards = [
    { title: 'Produtos', value: stats.products, icon: Package, color: 'text-accent' },
    { title: 'Clientes', value: stats.customers, icon: Users, color: 'text-primary' },
    { title: 'Vendas', value: stats.sales, icon: ShoppingCart, color: 'text-success' },
    { title: 'Receita', value: `R$ ${stats.revenue.toFixed(2)}`, icon: TrendingUp, color: 'text-primary' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
