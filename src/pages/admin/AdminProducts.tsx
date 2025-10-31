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
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  is_active: boolean;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [costDate, setCostDate] = useState<Date>(new Date());
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null]);
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null]);
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

  const handleImageChange = (index: number, file: File | null) => {
    const newImageFiles = [...imageFiles];
    const newImagePreviews = [...imagePreviews];
    
    newImageFiles[index] = file;
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImagePreviews[index] = reader.result as string;
        setImagePreviews(newImagePreviews);
      };
      reader.readAsDataURL(file);
    } else {
      newImagePreviews[index] = null;
      setImagePreviews(newImagePreviews);
    }
    
    setImageFiles(newImageFiles);
  };

  const uploadImage = async (file: File, productId: string, index: number): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}_${index}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
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
    setUploadingImages(true);

    try {
      // First create the product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          description: formData.description,
          size: formData.size || null,
          category: formData.category || null,
          brand: formData.brand || null,
          cost_price_usd: formData.cost_price_usd ? parseFloat(formData.cost_price_usd) : null,
          cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
          cost_date: format(costDate, 'yyyy-MM-dd'),
          price: parseFloat(formData.price),
        })
        .select()
        .single();

      if (productError) throw productError;

      // Upload images
      const imageUrls: (string | null)[] = [null, null, null];
      for (let i = 0; i < imageFiles.length; i++) {
        if (imageFiles[i]) {
          const url = await uploadImage(imageFiles[i]!, product.id, i + 1);
          imageUrls[i] = url;
        }
      }

      // Update product with image URLs
      const updateData: any = {};
      if (imageUrls[0]) updateData.image_url = imageUrls[0];
      if (imageUrls[1]) updateData.image_url_2 = imageUrls[1];
      if (imageUrls[2]) updateData.image_url_3 = imageUrls[2];

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', product.id);

        if (updateError) throw updateError;
      }

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
        price: '',
      });
      setImageFiles([null, null, null]);
      setImagePreviews([null, null, null]);
      setCostDate(new Date());
      loadProducts();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar produto');
    } finally {
      setUploadingImages(false);
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

              <div className="space-y-2">
                <Label>Fotos do Produto (até 3)</Label>
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="space-y-2">
                      <Label htmlFor={`image-${index}`} className="text-sm text-muted-foreground">
                        Foto {index + 1}
                      </Label>
                      <div className="flex flex-col gap-2">
                        {imagePreviews[index] && (
                          <div className="relative w-full aspect-square rounded-lg overflow-hidden border">
                            <img
                              src={imagePreviews[index]!}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <Input
                          id={`image-${index}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(index, e.target.files?.[0] || null)}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loadingRate || uploadingImages}>
                {uploadingImages ? 'Enviando imagens...' : loadingRate ? 'Carregando cotação...' : 'Criar Produto'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagem</TableHead>
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
                  <TableCell>
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs">
                        Sem foto
                      </div>
                    )}
                  </TableCell>
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
