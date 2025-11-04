import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Calendar, DollarSign, Pencil, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { fetchExchangeRate, calculateProfitMargin } from '@/lib/exchangeRate';
import { Badge } from '@/components/ui/badge';

interface ProductVariant {
  id?: string;
  size: string;
  cost_price_usd: string;
  cost_price: string;
  price: string;
  is_sold_out?: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  brand: string | null;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  is_active: boolean;
  variants?: ProductVariant[];
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [costDate, setCostDate] = useState<Date>(new Date());
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null]);
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null]);
  const [variants, setVariants] = useState<ProductVariant[]>([
    { size: '', cost_price_usd: '', cost_price: '', price: '', is_sold_out: false }
  ]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadExchangeRate(new Date());
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error loading categories:', error);
      toast.error('Erro ao carregar categorias');
    }
  };

  useEffect(() => {
    if (exchangeRate) {
      setVariants(prev => prev.map(variant => {
        if (variant.cost_price_usd && parseFloat(variant.cost_price_usd) > 0) {
          const costBRL = parseFloat(variant.cost_price_usd) * exchangeRate;
          return { ...variant, cost_price: costBRL.toFixed(2) };
        }
        return variant;
      }));
    }
  }, [exchangeRate]);

  const loadExchangeRate = async (date: Date) => {
    setLoadingRate(true);
    try {
      const rate = await fetchExchangeRate(date);
      if (rate) {
        setExchangeRate(rate);
        toast.success(`Cotação: US$ 1,00 = R$ ${rate.toFixed(4)}`);
      } else {
        toast.error('Não foi possível obter a cotação do dólar. Verifique se a data é um dia útil.');
      }
    } catch (error) {
      console.error('Erro ao carregar cotação:', error);
      toast.error('Erro ao buscar cotação do dólar. Tente novamente.');
    } finally {
      setLoadingRate(false);
    }
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
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (productsError) {
      toast.error('Erro ao carregar produtos');
      return;
    }

    // Load variants for each product
    const { data: variantsData, error: variantsError } = await supabase
      .from('product_variants')
      .select('*')
      .order('price', { ascending: true });

    if (variantsError) {
      toast.error('Erro ao carregar variações');
      return;
    }

    // Group variants by product_id
    const productsWithVariants = (productsData || []).map(product => ({
      ...product,
      variants: (variantsData || [])
        .filter(v => v.product_id === product.id)
        .map(v => ({
          id: v.id,
          size: v.size,
          cost_price_usd: v.cost_price_usd?.toString() || '',
          cost_price: v.cost_price?.toString() || '',
          price: v.price?.toString() || '',
          is_sold_out: v.is_sold_out || false,
        }))
    }));

    setProducts(productsWithVariants as Product[]);
  };

  const addVariant = () => {
    setVariants([...variants, { size: '', cost_price_usd: '', cost_price: '', price: '', is_sold_out: false }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: string) => {
    const newVariants = [...variants];
    
    if (field === 'is_sold_out') {
      newVariants[index] = { ...newVariants[index], is_sold_out: value === 'true' };
    } else {
      newVariants[index] = { ...newVariants[index], [field]: value };
    }
    
    // Auto-calculate cost_price when cost_price_usd changes
    if (field === 'cost_price_usd' && exchangeRate && value) {
      const costBRL = parseFloat(value) * exchangeRate;
      newVariants[index].cost_price = costBRL.toFixed(2);
    }
    
    setVariants(newVariants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate at least one variant with required fields
    const validVariants = variants.filter(v => v.size && v.price && parseFloat(v.price) > 0);
    if (validVariants.length === 0) {
      toast.error('Adicione pelo menos uma variação com tamanho e preço');
      return;
    }
    
    setUploadingImages(true);

    try {
      if (editingProduct) {
        // Update existing product
        const updateData: any = {
          name: formData.name,
          description: formData.description || null,
          category: formData.category || null,
          brand: formData.brand || null,
        };

        // Upload new images if provided
        for (let i = 0; i < imageFiles.length; i++) {
          if (imageFiles[i]) {
            const url = await uploadImage(imageFiles[i]!, editingProduct.id, i + 1);
            if (i === 0) updateData.image_url = url;
            if (i === 1) updateData.image_url_2 = url;
            if (i === 2) updateData.image_url_3 = url;
          }
        }

        const { error: updateError } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', editingProduct.id);

        if (updateError) throw updateError;

        // Delete existing variants
        const { error: deleteVariantsError } = await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', editingProduct.id);

        if (deleteVariantsError) throw deleteVariantsError;

        // Create new variants
        const variantsToInsert = validVariants.map(variant => ({
          product_id: editingProduct.id,
          size: variant.size,
          cost_price_usd: variant.cost_price_usd ? parseFloat(variant.cost_price_usd) : null,
          cost_price: variant.cost_price ? parseFloat(variant.cost_price) : null,
          price: parseFloat(variant.price),
          is_sold_out: variant.is_sold_out || false,
        }));

        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantsToInsert);

        if (variantsError) throw variantsError;

        toast.success('Produto atualizado com sucesso!');
      } else {
        // Create new product
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert([{
            name: formData.name,
            description: formData.description || null,
            category: formData.category || null,
            brand: formData.brand || null,
            price: null as any, // Now using product_variants for pricing
          }])
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

        // Create product variants
        const variantsToInsert = validVariants.map(variant => ({
          product_id: product.id,
          size: variant.size,
          cost_price_usd: variant.cost_price_usd ? parseFloat(variant.cost_price_usd) : null,
          cost_price: variant.cost_price ? parseFloat(variant.cost_price) : null,
          price: parseFloat(variant.price),
          is_sold_out: variant.is_sold_out || false,
        }));

        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantsToInsert);

        if (variantsError) throw variantsError;

        toast.success('Produto criado com sucesso!');
      }
      
      setOpen(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        brand: '',
      });
      setVariants([{ size: '', cost_price_usd: '', cost_price: '', price: '', is_sold_out: false }]);
      setImageFiles([null, null, null]);
      setImagePreviews([null, null, null]);
      setCostDate(new Date());
      loadProducts();
    } catch (error: any) {
      toast.error(error.message || `Erro ao ${editingProduct ? 'atualizar' : 'criar'} produto`);
    } finally {
      setUploadingImages(false);
    }
  };

  const calculateVariantMargin = (price: string, costPrice: string) => {
    if (!price || !costPrice || parseFloat(price) <= 0 || parseFloat(costPrice) <= 0) return 0;
    return calculateProfitMargin(parseFloat(price), parseFloat(costPrice));
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      brand: product.brand || '',
    });
    
    // Load variants
    if (product.variants && product.variants.length > 0) {
      setVariants(product.variants);
    } else {
      setVariants([{ size: '', cost_price_usd: '', cost_price: '', price: '', is_sold_out: false }]);
    }
    
    // Set image previews
    const previews: (string | null)[] = [
      product.image_url || null,
      product.image_url_2 || null,
      product.image_url_3 || null,
    ];
    setImagePreviews(previews);
    setImageFiles([null, null, null]);
    
    setOpen(true);
  };

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

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        brand: '',
      });
      setVariants([{ size: '', cost_price_usd: '', cost_price: '', price: '', is_sold_out: false }]);
      setImageFiles([null, null, null]);
      setImagePreviews([null, null, null]);
      setCostDate(new Date());
    }
  };

  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      (product.brand && product.brand.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Produtos</h1>
        <Dialog open={open} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent 
            onInteractOutside={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Atualize os dados do produto.' : 'Preencha os dados do produto. O preço em R$ será calculado automaticamente com base na cotação do dólar.'}
              </DialogDescription>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Variações de Tamanho e Preço *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Variação
                  </Button>
                </div>

                {variants.map((variant, index) => {
                  const margin = calculateVariantMargin(variant.price, variant.cost_price);
                  
                  return (
                    <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Variação {index + 1}</span>
                        {variants.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVariant(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`size-${index}`}>Tamanho *</Label>
                        <Input
                          id={`size-${index}`}
                          value={variant.size}
                          onChange={(e) => updateVariant(index, 'size', e.target.value)}
                          placeholder="Ex: 50ml, 100ml, 200ml"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`cost_usd-${index}`}>Custo (US$) *</Label>
                          <Input
                            id={`cost_usd-${index}`}
                            type="number"
                            step="0.01"
                            value={variant.cost_price_usd}
                            onChange={(e) => updateVariant(index, 'cost_price_usd', e.target.value)}
                            placeholder="0.00"
                            disabled={loadingRate}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`cost_brl-${index}`}>Custo (R$)</Label>
                          <Input
                            id={`cost_brl-${index}`}
                            type="number"
                            step="0.01"
                            value={variant.cost_price}
                            disabled
                            placeholder="Auto"
                            className="bg-muted"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`price-${index}`}>Preço de Venda (R$) *</Label>
                        <Input
                          id={`price-${index}`}
                          type="number"
                          step="0.01"
                          value={variant.price}
                          onChange={(e) => updateVariant(index, 'price', e.target.value)}
                          placeholder="0.00"
                        />
                        {variant.price && variant.cost_price && parseFloat(variant.price) > 0 && parseFloat(variant.cost_price) > 0 && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-sm text-muted-foreground">Margem:</span>
                            <Badge 
                              variant={margin >= 50 ? "default" : margin >= 30 ? "secondary" : margin >= 0 ? "outline" : "destructive"}
                              className={
                                margin >= 50 ? "bg-green-500 text-white" : 
                                margin >= 30 ? "bg-blue-500 text-white" : 
                                margin >= 0 ? "" : 
                                "bg-red-500 text-white"
                              }
                            >
                              {margin >= 0 ? '+' : ''}{margin.toFixed(1)}%
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                          id={`sold-out-${index}`}
                          checked={variant.is_sold_out || false}
                          onCheckedChange={(checked) => 
                            updateVariant(index, 'is_sold_out', checked ? 'true' : 'false')
                          }
                        />
                        <Label 
                          htmlFor={`sold-out-${index}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          Produto Esgotado
                        </Label>
                      </div>
                    </div>
                  );
                })}
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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar por nome ou marca..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imagem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Variações</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
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
                  <TableCell>
                    <div className="space-y-1">
                      {product.variants && product.variants.length > 0 ? (
                        product.variants.map((variant, idx) => {
                          const margin = calculateVariantMargin(variant.price, variant.cost_price);
                          return (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span className="font-medium">{variant.size}</span>
                              <span className="text-muted-foreground">
                                R$ {parseFloat(variant.price).toFixed(2)}
                              </span>
                              {margin > 0 && (
                                <Badge 
                                  variant={margin >= 50 ? "default" : margin >= 30 ? "secondary" : "outline"}
                                  className="text-xs"
                                >
                                  {margin.toFixed(0)}%
                                </Badge>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-muted-foreground">Sem variações</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{product.category || '-'}</TableCell>
                  <TableCell>{product.brand || '-'}</TableCell>
                  <TableCell>{product.is_active ? 'Ativo' : 'Inativo'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
