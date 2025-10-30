# Scripts de Administração

## Criar Usuário Administrador

Este script permite criar um novo usuário e promovê-lo automaticamente a administrador.

### Pré-requisitos

Você precisa da **Service Role Key** do Supabase.

### Como obter a Service Role Key:

1. Acesse o Supabase Dashboard: https://byzwcocakjoqepewdvgc.supabase.co
2. Vá em **Project Settings** > **API**
3. Copie a chave `service_role` (a chave secreta, **não** a anon/public)

### Como usar:

**Opção 1: Com variável de ambiente inline**

```bash
SUPABASE_SERVICE_ROLE_KEY=sua-chave-aqui npm run create-admin
```

**Opção 2: Criar arquivo .env.local**

Crie um arquivo `.env.local` na raiz do projeto com:

```env
SUPABASE_SERVICE_ROLE_KEY=sua-chave-aqui
```

Depois execute:

```bash
npm run create-admin
```

### O que o script faz:

1. ✅ Cria um novo usuário no Supabase Auth
2. ✅ Confirma o email automaticamente (sem precisar verificar)
3. ✅ Cria o perfil do usuário na tabela `profiles`
4. ✅ Adiciona a role `admin` na tabela `user_roles`

### Exemplo de uso:

```bash
$ SUPABASE_SERVICE_ROLE_KEY=sua-chave npm run create-admin

🔐 Criação de Usuário Administrador

Email do administrador: admin@exemplo.com
Senha (mínimo 6 caracteres): senha123
Nome completo: Administrador Principal

📝 Criando usuário...
✅ Usuário criado com sucesso!
   ID: abc-123-def
   Email: admin@exemplo.com

👑 Promovendo a administrador...
✅ Usuário promovido a administrador com sucesso!

🎉 Pronto! Você já pode fazer login como administrador.
   Email: admin@exemplo.com
   Senha: senha123

🔗 Acesse: http://localhost:5173/auth
```

---

## Método Alternativo (SQL direto)

Se preferir, você pode criar um admin diretamente no SQL Editor do Supabase:

### 1. Criar o usuário (se ainda não existir)

Vá em **Authentication** > **Users** > **Add user**

### 2. Promover a admin

No **SQL Editor**, execute:

```sql
-- Substitua pelo email do usuário
SELECT public.promote_to_admin('email@exemplo.com');
```

---

## ⚠️ Segurança

- **NUNCA** commit a Service Role Key no Git
- O arquivo `.env.local` já está no `.gitignore`
- A Service Role Key tem acesso completo ao banco de dados
- Use apenas em ambiente de desenvolvimento/administrativo

