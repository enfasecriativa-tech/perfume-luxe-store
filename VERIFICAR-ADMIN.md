# 🔍 Verificar e Corrigir Problema de Admin

## O usuário foi criado mas não é reconhecido como Admin

### ✅ Passo 1: Verificar se o usuário tem a role de admin

1. **Acesse:** https://byzwcocakjoqepewdvgc.supabase.co
2. Vá em **Table Editor** (menu lateral)
3. Clique na tabela **user_roles**
4. Procure pelo seu usuário (pelo email ou user_id)

**O que você deve ver:**
- Uma linha com `user_id` = seu ID
- E `role` = **admin**

**Se NÃO encontrar nenhuma linha:**
- Significa que o SQL não foi executado ou falhou
- Vá para o Passo 2

---

### ✅ Passo 2: Promover o usuário a Admin

1. Vá em **SQL Editor** (menu lateral)
2. Clique em **New query**
3. Cole este comando (SUBSTITUA o email pelo seu):

```sql
SELECT public.promote_to_admin('SEU-EMAIL@EXEMPLO.COM');
```

**Exemplo:**
```sql
SELECT public.promote_to_admin('admin@lojaperfume.com');
```

4. Clique em **Run** (ou pressione Ctrl/Cmd + Enter)

**Resultado esperado:**
- Deve aparecer uma mensagem de sucesso
- Ou simplesmente completar sem erros

---

### ✅ Passo 3: Verificar novamente a tabela user_roles

1. Volte em **Table Editor** > **user_roles**
2. Agora você DEVE ver uma linha com:
   - `user_id`: o ID do seu usuário
   - `role`: **admin**
   - `created_at`: data/hora de agora

---

### ✅ Passo 4: Fazer logout e login novamente

**IMPORTANTE:** O sistema só verifica se você é admin no momento do login!

1. Faça **logout** do sistema
2. Feche o navegador (ou use aba anônima)
3. Acesse: http://localhost:5173/auth
4. Faça **login** novamente
5. Clique no ícone de usuário (canto superior direito)
6. Você DEVE ver **"🛡️ Painel Admin"** agora!

---

## 🔍 Diagnóstico Completo

Se ainda não funcionar, vamos fazer um diagnóstico:

### No Supabase Dashboard:

**1. Verificar o usuário existe:**
- **Authentication** > **Users**
- Encontre seu email
- Anote o **User ID** (UUID)

**2. Verificar a role:**
- **Table Editor** > **user_roles**
- Procure pelo **User ID** que você anotou
- Deve ter uma linha com `role = admin`

**3. Se NÃO tiver a linha, execute o SQL:**
```sql
-- Substitua o email
SELECT public.promote_to_admin('seu-email@exemplo.com');
```

**4. Se der erro no SQL, tente inserir diretamente:**
```sql
-- Substitua USER_ID pelo ID que você anotou
INSERT INTO public.user_roles (user_id, role)
VALUES ('COLE-O-USER-ID-AQUI', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

**Exemplo:**
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('abc123def-4567-890a-bcde-f1234567890a', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## ✅ Checklist Final

- [ ] Usuário existe em **Authentication > Users**
- [ ] Email está confirmado (sem ícone de aviso)
- [ ] Existe uma linha em **user_roles** com role = 'admin'
- [ ] Fiz **logout** e **login** novamente
- [ ] Agora vejo "🛡️ Painel Admin" no menu

---

## 🎯 Resumo Rápido

```bash
1. SQL Editor > Execute:
   SELECT public.promote_to_admin('seu-email@exemplo.com');

2. Fazer logout

3. Fazer login novamente

4. ✅ Ver "Painel Admin" no menu!
```

