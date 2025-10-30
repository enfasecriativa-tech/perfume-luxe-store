import { createClient } from '@supabase/supabase-js';
import { createInterface } from 'readline';

const SUPABASE_URL = "https://byzwcocakjoqepewdvgc.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não está definida');
  console.log('\nPara usar este script, você precisa da Service Role Key do Supabase.');
  console.log('1. Acesse: https://byzwcocakjoqepewdvgc.supabase.co/project/byzwcocakjoqepewdvgc/settings/api');
  console.log('2. Copie a "service_role" key (secret)');
  console.log('3. Execute: SUPABASE_SERVICE_ROLE_KEY=sua-key npm run create-admin\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise(resolve => rl.question(query, resolve));
};

async function createAdmin() {
  console.log('🔐 Criação de Usuário Administrador\n');

  try {
    const email = await question('Email do administrador: ');
    const password = await question('Senha (mínimo 6 caracteres): ');
    const fullName = await question('Nome completo: ');

    if (!email || !password || password.length < 6) {
      console.error('❌ Email e senha (mínimo 6 caracteres) são obrigatórios');
      rl.close();
      return;
    }

    console.log('\n📝 Criando usuário...');

    // Criar usuário
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || 'Administrador'
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError.message);
      rl.close();
      return;
    }

    console.log('✅ Usuário criado com sucesso!');
    console.log(`   ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);

    // Promover a admin
    console.log('\n👑 Promovendo a administrador...');
    
    const { error: promoteError } = await supabase.rpc('promote_to_admin', {
      user_email: email
    });

    if (promoteError) {
      console.error('❌ Erro ao promover a admin:', promoteError.message);
      console.log('\n💡 Você pode promover manualmente executando no SQL Editor:');
      console.log(`   SELECT public.promote_to_admin('${email}');`);
      rl.close();
      return;
    }

    console.log('✅ Usuário promovido a administrador com sucesso!');
    console.log('\n🎉 Pronto! Você já pode fazer login como administrador.');
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${password}`);
    console.log('\n🔗 Acesse: http://localhost:5173/auth');

  } catch (error: any) {
    console.error('❌ Erro inesperado:', error.message);
  } finally {
    rl.close();
  }
}

createAdmin();

