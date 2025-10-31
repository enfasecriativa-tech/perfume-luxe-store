import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchExchangeRate, calculateProfitMargin } from '@/lib/exchangeRate';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  cost_price: number | null;
  cost_price_usd: number | null;
  cost_date: string | null;
  size: string | null;
  category: string | null;
  brand: string | null;
  is_active: boolean;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [costDate, setCostDate] = useState<Date>(new Date());
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    size: '',
    category: '',
    brand: '',
    cost_price_usd: '',
    cost_price: '',
    price: '',
  });

  useEffect(() => {
    loadProducts();
    loadExchangeRate(new Date());
  }, []);

  useEffect(() => {
    if (formData.cost_price_usd && exchangeRate) {
      const costBRL = parseFloat(formData.cost_price_usd) * exchangeRate;
      setFormData(prev => ({ ...prev, cost_price: costBRL.toFixed(2) }));
    }
  }, [formData.cost_price_usd, exchangeRate]);

  const loadExchangeRate = async (date: Date) => {
    setLoadingRate(true);
    const rate = await fetchExchangeRate(date);
    if (rate) {
      setExchangeRate(rate);
      toast.success(`Cotação: US$ 1,00 = R$ ${rate.toFixed(4)}`);
    } else {
      toast.error('Não foi possível obter a cotação do dólar');
    }
    setLoadingRate(false);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setCostDate(date);
      loadExchangeRate(date);
    }
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar produtos');
    } else {
      setProducts((data || []) as unknown as Product[]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from('products').insert({
      name: formData.name,
      description: formData.description,
      size: formData.size || null,
      category: formData.category || null,
      brand: formData.brand || null,
      cost_price_usd: formData.cost_price_usd ? parseFloat(formData.cost_price_usd) : null,
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
      cost_date: format(costDate, 'yyyy-MM-dd'),
      price: parseFloat(formData.price),
    });

    if (error) {
      toast.error('Erro ao criar produto');
    } else {
      toast.success('Produto criado com sucesso!');
      setOpen(false);
      setFormData({ 
        name: '', 
        description: '', 
        size: '',
        category: '', 
        brand: '', 
        cost_price_usd: '',
        cost_price: '',
        price: '' 
      });
      setCostDate(new Date());
      loadProducts();
    }
  };

  const profitMargin = formData.price && formData.cost_price 
    ? calculateProfitMargin(parseFloat(formData.price), parseFloat(formData.cost_price))
    : 0;

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      toast.error('Erro ao excluir produto');
    } else {
      toast.success('Produto excluído com sucesso!');
      loadProducts();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Produto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: Perfumes"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Ex: Dior"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Tamanho</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="Ex: 100ml"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Data da Cotação</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {format(costDate, 'PPP', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={costDate}
                      onSelect={handleDateChange}
                      locale={ptBR}
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
                {exchangeRate && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-3 w-3" />
                    Cotação: US$ 1,00 = R$ {exchangeRate.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost_price_usd">Preço de Custo (US$) *</Label>
                  <Input
                    id="cost_price_usd"
                    type="number"
                    step="0.01"
                    value={formData.cost_price_usd}
                    onChange={(e) => setFormData({ ...formData, cost_price_usd: e.target.value })}
                    placeholder="0.00"
                    required
                    disabled={loadingRate}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost_price">Preço de Custo (R$)</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    disabled
                    placeholder="Calculado automaticamente"
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preço de Venda (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
                {profitMargin > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant={profitMargin >= 50 ? "default" : profitMargin >= 30 ? "secondary" : "destructive"}>
                      Margem de Lucro: {profitMargin.toFixed(2)}%
                    </Badge>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loadingRate}>
                {loadingRate ? 'Carregando cotação...' : 'Criar Produto'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Custo (R$)</TableHead>
              <TableHead>Venda (R$)</TableHead>
              <TableHead>Margem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const margin = product.cost_price 
                ? calculateProfitMargin(Number(product.price), Number(product.cost_price))
                : 0;
              
              return (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.size || '-'}</TableCell>
                  <TableCell>{product.category || '-'}</TableCell>
                  <TableCell>{product.brand || '-'}</TableCell>
                  <TableCell>
                    {product.cost_price ? `R$ ${Number(product.cost_price).toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>R$ {Number(product.price).toFixed(2)}</TableCell>
                  <TableCell>
                    {margin > 0 && (
                      <Badge variant={margin >= 50 ? "default" : margin >= 30 ? "secondary" : "destructive"}>
                        {margin.toFixed(1)}%
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{product.is_active ? 'Ativo' : 'Inativo'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminProducts;
