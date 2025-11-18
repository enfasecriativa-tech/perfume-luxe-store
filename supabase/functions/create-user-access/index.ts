// import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

export type CreateUserAccessRequest = {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'staff';
};

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const body = (await req.json()) as Partial<CreateUserAccessRequest>;
    const { email, password, full_name, role } = body;

    if (!email || !password || !full_name || !role) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRole) {
      return new Response(JSON.stringify({ error: 'Missing server configuration' }), { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceRole);

    // 1) Create or fetch the user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createErr) {
      // If user exists, retrieve its id
      if (createErr.message?.toLowerCase().includes('user already registered')) {
        const { data: exists, error: listErr } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 1,
          filter: { email },
        });
        if (listErr || !exists?.users?.length) {
          return new Response(JSON.stringify({ error: listErr?.message || 'User lookup failed' }), { status: 400 });
        }
        const userId = exists.users[0].id;
        // Insert role (use upsert to avoid conflicts)
        const { error: roleErr } = await admin
          .from('user_roles')
          .insert({ user_id: userId, role })
          .select();
        
        if (roleErr) {
          // If role already exists, that's okay
          if (roleErr.message?.includes('duplicate') || roleErr.message?.includes('unique')) {
            console.log(`Role ${role} already exists for user ${userId}`);
            return new Response(JSON.stringify({ ok: true, userId, updated: true, message: 'Usuário já possui esta função' }), { status: 200 });
          }
          return new Response(JSON.stringify({ error: `Erro ao atribuir função: ${roleErr.message}` }), { status: 400 });
        }
        return new Response(JSON.stringify({ ok: true, userId, updated: true, message: 'Função atribuída com sucesso' }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: createErr.message }), { status: 400 });
    }

    const userId = created.user.id;

    // 2) Ensure profile exists (trigger covers this, but be explicit)
    await admin.from('profiles').upsert({ id: userId, full_name, phone: null }).select();

    // 3) Assign role (use upsert to avoid conflicts if role already exists)
    const { error: roleErr } = await admin
      .from('user_roles')
      .insert({ user_id: userId, role })
      .select();
    
    if (roleErr) {
      // If role already exists, that's okay - user already has the role
      if (roleErr.message?.includes('duplicate') || roleErr.message?.includes('unique')) {
        console.log(`Role ${role} already exists for user ${userId}`);
      } else {
        return new Response(JSON.stringify({ error: `Erro ao atribuir função: ${roleErr.message}` }), { status: 400 });
      }
    }

    return new Response(JSON.stringify({ ok: true, userId, message: 'Usuário criado e função atribuída com sucesso' }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
  }
}

// Deno.serve is auto-wrapped by the functions runtime when using default export

