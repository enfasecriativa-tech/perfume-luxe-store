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
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('admin');
  const [loading, setLoading] = useState(false);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      console.log('🔗 URL do Supabase:', (supabase as any).supabaseUrl);
      console.log('🔑 Tentando criar usuário via RPC create_user_with_role...');

      // Mapeia 'staff' para 'user' se o enum for 'user', ou mantém se for string.
      // O enum no banco é ('admin', 'user'). Então 'staff' deve virar 'user'.
      const dbRole = role === 'staff' ? 'user' : 'admin';

      const { data, error } = await supabase.rpc('create_user_with_role', {
        email,
        password,
        full_name: fullName,
        role_name: dbRole
      });

      if (error) {
        console.error('Erro no RPC:', error);
        throw error;
      }

      // O RPC retorna um JSON com { ok: boolean, error?: string, userId?: string }
      if (!data?.ok) {
        const errorMsg = data?.error || 'Falha ao criar acesso';
        console.error('Erro retornado pelo RPC:', errorMsg);
        throw new Error(errorMsg);
      }

      toast.success('Acesso concedido com sucesso!');
      setEmail('');
      setFullName('');
      setPassword('');
      setRole('admin');
    } catch (error: any) {
      console.error('Erro completo:', error);
      const errorMessage = error.message || 'Erro ao conceder acesso';
      toast.error(errorMessage);
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
          <form onSubmit={handlePromote} className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">E-mail do usuário</Label>
              <Input id="email" type="email" placeholder="usuario@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" type="text" placeholder="Nome e sobrenome" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha temporária</Label>
              <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
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
            <div className="md:col-span-4">
              <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? 'Concedendo...' : 'Conceder Acesso'}
              </Button>
            </div>
          </form>

          <p className="text-xs text-muted-foreground mt-4">
            O usuário será criado e confirmado automaticamente. Em seguida, a função selecionada será atribuída.
          </p>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Nota:</strong> Se encontrar erros, verifique se a Edge Function "create-user-access" está deployada no Supabase.
              <br />
              Para fazer deploy: <code className="text-xs">supabase functions deploy create-user-access</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAccess;


