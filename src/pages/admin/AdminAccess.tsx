import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ShieldPlus } from 'lucide-react';

const AdminAccess = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('admin');
  const [loading, setLoading] = useState(false);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      if (role === 'admin') {
        const { error } = await supabase.rpc('promote_to_admin', { user_email: email });
        if (error) throw error;
        toast.success('Usuário promovido a ADMIN com sucesso!');
      } else {
        const { error } = await supabase.rpc('promote_to_staff', { user_email: email });
        if (error) throw error;
        toast.success('Usuário promovido a STAFF com sucesso!');
      }
      setEmail('');
      setRole('admin');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao conceder acesso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Criar Acesso</h1>
        <p className="text-muted-foreground">Conceda acesso de administrador ou staff a um usuário existente</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldPlus className="h-5 w-5" />
            Conceder Acesso
          </CardTitle>
          <CardDescription>
            Informe o e-mail do usuário que já possui conta. Depois selecione a função desejada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePromote} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">E-mail do usuário</Label>
              <Input id="email" type="email" placeholder="usuario@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Função</Label>
              <Select value={role} onValueChange={(v: 'admin' | 'staff') => setRole(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? 'Concedendo...' : 'Conceder Acesso'}
              </Button>
            </div>
          </form>

          <p className="text-xs text-muted-foreground mt-4">
            Dica: Se o usuário ainda não tem conta, crie pelo Supabase (Authentication → Users → Add user) com "Auto Confirm User" e depois use este formulário para atribuir a função.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAccess;


