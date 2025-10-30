import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchCep, formatCep, BRAZILIAN_STATES } from '@/lib/cep';

interface Address {
  id: string;
  label: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  is_default: boolean;
}

export const AddressesTab = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  
  const [formData, setFormData] = useState({
    label: '',
    zip_code: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    is_default: false
  });

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      label: '',
      zip_code: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      is_default: false
    });
    setEditingAddress(null);
  };

  const handleOpenDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        label: address.label,
        zip_code: address.zip_code,
        street: address.street,
        number: address.number,
        complement: address.complement || '',
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        is_default: address.is_default
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingAddress) {
        const { error } = await supabase
          .from('addresses')
          .update(formData)
          .eq('id', editingAddress.id);
        
        if (error) throw error;
        toast.success('Endereço atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('addresses')
          .insert({
            ...formData,
            user_id: user?.id
          });
        
        if (error) throw error;
        toast.success('Endereço adicionado com sucesso!');
      }

      setDialogOpen(false);
      resetForm();
      loadAddresses();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar endereço');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este endereço?')) return;

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Endereço removido com sucesso!');
      loadAddresses();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover endereço');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Remove default from all addresses
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user?.id);

      // Set new default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
      toast.success('Endereço padrão atualizado!');
      loadAddresses();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar endereço padrão');
    }
  };

  const handleCepChange = async (value: string) => {
    const formatted = formatCep(value);
    setFormData({ ...formData, zip_code: formatted });

    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      const cepData = await fetchCep(cleanCep);
      setLoadingCep(false);

      if (cepData) {
        setFormData(prev => ({
          ...prev,
          street: cepData.street,
          neighborhood: cepData.neighborhood,
          city: cepData.city,
          state: cepData.state
        }));
        toast.success('Endereço preenchido automaticamente!');
      } else {
        toast.error('CEP não encontrado');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Meus Endereços</h2>
          <p className="text-muted-foreground">Gerencie seus endereços de entrega</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Endereço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Editar Endereço' : 'Novo Endereço'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="label">Nome do Endereço*</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Ex: Casa, Trabalho, Casa da Mãe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip_code">CEP*</Label>
                  <Input
                    id="zip_code"
                    value={formData.zip_code}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    maxLength={9}
                    disabled={loadingCep}
                    required
                  />
                  {loadingCep && (
                    <p className="text-xs text-muted-foreground">Buscando endereço...</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">Rua*</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="number">Número*</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={formData.complement}
                    onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                    placeholder="Apto, Bloco, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro*</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade*</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado*</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(value) => setFormData({ ...formData, state: value })}
                    required
                  >
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAZILIAN_STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label} ({state.value})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Endereço'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhum endereço cadastrado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{address.label}</h3>
                      {address.is_default && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                          <Star className="h-3 w-3 fill-current" />
                          Padrão
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        {address.street}, {address.number}
                        {address.complement && ` - ${address.complement}`}
                      </p>
                      <p>{address.neighborhood}</p>
                      <p>
                        {address.city} - {address.state}
                      </p>
                      <p>CEP: {address.zip_code}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!address.is_default && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSetDefault(address.id)}
                        title="Marcar como padrão"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleOpenDialog(address)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
