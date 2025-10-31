# 🚀 Comandos Rápidos para Criar Admin

## ✅ Forma Mais Simples (Recomendada)

### 1. No Supabase Dashboard

**URL:** https://byzwcocakjoqepewdvgc.supabase.co

### 2. Confirmar Email do Usuário Existente

Se você já criou o usuário e está dando erro de login:

1. **Authentication** > **Users**
2. Clique nos **3 pontinhos** (...) ao lado do seu usuário
3. Clique em **"Confirm email"** ou edite e marque como confirmado
4. Tente fazer login novamente

---

## 🔄 Ou Recriar o Usuário Corretamente

### Passo 1: Deletar o usuário antigo (se necessário)
1. **Authentication** > **Users**
2. Clique nos 3 pontinhos (...) ao lado do usuário
3. Clique em **"Delete user"**

### Passo 2: Criar novo usuário
1. **Authentication** > **Users** > **"Add user"** > **"Create new user"**
2. Preencha:
   ```
   Email: admin@lojaperfume.com
   Password: SuaSenhaSegura123!
   ✅ Auto Confirm User: MARCAR ESTA OPÇÃO
   ```
3. Clique em **"Create user"**

### Passo 3: Promover a Admin
1. **SQL Editor** > **New query**
2. Cole e execute:
```sql
SELECT public.promote_to_admin('admin@lojaperfume.com');
```

### Passo 4: Fazer Login
- URL: http://localhost:5173/auth
- Use o email e senha que você criou

---

## 🛠️ Verificar se Está Funcionando

### No Dashboard:
1. **Table Editor** > **user_roles**
2. Procure pelo seu `user_id`
3. Confirme que `role = admin`

### No Sistema:
1. Faça login
2. Clique no ícone de usuário (canto superior direito)
3. Você deve ver **"🛡️ Painel Admin"** no menu

---

## ❓ Problemas Comuns

### "Invalid login credentials"
✅ **Solução:** Confirme o email do usuário (veja opção 1 acima)

### "User already registered"
✅ **Solução:** Delete o usuário antigo e crie novamente com "Auto Confirm User" marcado

### Não vejo "Painel Admin" no menu
✅ **Solução:** Execute o SQL para promover a admin:
```sql
SELECT public.promote_to_admin('seu-email@exemplo.com');
```

---

## 📝 Credenciais de Exemplo

Você pode usar estas credenciais:

```
Email: admin@lojaperfume.com
Senha: Admin123!
```

⚠️ **Lembre-se de marcar "Auto Confirm User" ao criar!**

