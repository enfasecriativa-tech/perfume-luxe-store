# 🔐 Como Criar um Usuário Administrador

Existem **3 formas** de criar um usuário administrador no sistema:

---

## ✅ Método 1: Via Supabase Dashboard (MAIS FÁCIL)

Este é o método **mais simples e recomendado**.

### Passo a passo:

1. **Acesse o Supabase Dashboard:**
   - URL: https://byzwcocakjoqepewdvgc.supabase.co

2. **Crie o usuário:**
   - Clique em **Authentication** (no menu lateral)
   - Clique em **Users**
   - Clique em **Add user** > **Create new user**
   - Preencha:
     - Email: seu-email@exemplo.com
     - Password: sua-senha-segura
     - ✅ Marque: **Auto Confirm User** (para não precisar confirmar email)
   - Clique em **Create user**

3. **Promova o usuário a Admin:**
   - Clique em **SQL Editor** (no menu lateral)
   - Clique em **New query**
   - Cole o seguinte comando (substitua o email):

   ```sql
   SELECT public.promote_to_admin('seu-email@exemplo.com');
   ```

   - Clique em **Run** (ou pressione `Ctrl/Cmd + Enter`)

4. **Pronto!** ✅
   - Agora você já pode fazer login em: http://localhost:5173/auth
   - Use o email e senha que você criou

---

## 🚀 Método 2: Via Script Automatizado

Use o script que criei para automatizar todo o processo.

### Pré-requisitos:

Você precisa da **Service Role Key** do Supabase:

1. Acesse: https://byzwcocakjoqepewdvgc.supabase.co/project/byzwcocakjoqepewdvgc/settings/api
2. Role até **Project API keys**
3. Copie a chave `service_role` (⚠️ **NÃO** é a chave `anon/public`)

### Como usar:

**Executar o script:**

```bash
SUPABASE_SERVICE_ROLE_KEY=sua-chave-aqui npm run create-admin
```

**Exemplo:**

```bash
$ SUPABASE_SERVICE_ROLE_KEY=eyJhbG... npm run create-admin

🔐 Criação de Usuário Administrador

Email do administrador: admin@lojaperfume.com
Senha (mínimo 6 caracteres): Admin@123
Nome completo: Administrador da Loja

📝 Criando usuário...
✅ Usuário criado com sucesso!
   ID: abc-123-def-456
   Email: admin@lojaperfume.com

👑 Promovendo a administrador...
✅ Usuário promovido a administrador com sucesso!

🎉 Pronto! Você já pode fazer login como administrador.
   Email: admin@lojaperfume.com
   Senha: Admin@123

🔗 Acesse: http://localhost:5173/auth
```

---

## 🛠️ Método 3: Promover Usuário Existente

Se você já tem uma conta criada e quer torná-la admin:

### Via Supabase Dashboard:

1. Acesse o **SQL Editor**
2. Execute (substitua o email):

```sql
SELECT public.promote_to_admin('seu-email@exemplo.com');
```

---

## 🔍 Como Verificar se Deu Certo

### Via Dashboard:

1. Vá em **Table Editor**
2. Clique na tabela **user_roles**
3. Procure pelo `user_id` do seu usuário
4. Verifique se a coluna `role` está como **admin**

### Via App:

1. Faça login no sistema
2. Se você for admin, terá acesso ao botão **"Painel Admin"** no menu de usuário
3. Ao acessar `/admin`, você verá o painel administrativo completo

---

## ⚠️ Importante

- A **Service Role Key** é sensível! Nunca a compartilhe ou faça commit dela no Git
- Use senhas fortes para contas de administrador
- Em produção, sempre use autenticação de dois fatores (2FA)

---

## ❓ Problemas Comuns

### "User already exists"
- O email já está cadastrado
- Use o Método 3 para promover o usuário existente

### "Function not found"
- As migrações não foram executadas corretamente
- Execute: `supabase db push` (se estiver usando Supabase CLI)

### "Invalid API key"
- Você está usando a chave errada
- Use a **service_role** key, não a **anon** key

---

## 📞 Suporte

Se tiver problemas, me avise que eu te ajudo! 😊

