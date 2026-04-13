import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Client with user's JWT to verify identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify caller via getUser
    const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Não autorizado: ' + (authError?.message || 'Token inválido') }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = caller.id;

    // Admin client with service role (bypasses RLS)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check superadmin
    const { data: saCheck } = await adminClient
      .from('superadmin_roles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!saCheck) {
      return new Response(JSON.stringify({ error: 'Apenas superadmins podem criar organizações' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { name, slug, contact_email, phone, website, description, plan_id, admin_name, admin_email } = body;

    if (!name || !slug || !admin_name || !admin_email) {
      return new Response(JSON.stringify({ error: 'Campos obrigatórios não preenchidos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check unique slug
    const { data: existingOrg } = await adminClient
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existingOrg) {
      return new Response(JSON.stringify({ error: 'Já existe uma organização com este nome/slug' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if admin email already exists
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', admin_email)
      .maybeSingle();

    if (existingProfile) {
      return new Response(JSON.stringify({ error: 'Este email de admin já está registrado no sistema' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate random password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let tempPassword = '';
    for (let i = 0; i < 12; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // 1. Create auth user (auto-confirmed)
    const { data: authData, error: createUserError } = await adminClient.auth.admin.createUser({
      email: admin_email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: admin_name },
    });

    if (createUserError) {
      if (createUserError.code === 'email_exists' || createUserError.status === 422) {
        return new Response(JSON.stringify({ error: 'Este email de admin já está registrado no sistema' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.error('[create-organization] Error creating user:', createUserError);
      return new Response(JSON.stringify({ error: 'Erro ao criar usuário admin: ' + (createUserError.message || 'desconhecido') }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!authData.user) {
      return new Response(JSON.stringify({ error: 'Erro ao criar usuário admin: usuário não retornado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminUserId = authData.user.id;

    // 2. Create organization
    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .insert({
        name,
        slug,
        contact_email,
        phone,
        website,
        description,
        plan_id: plan_id || null,
        owner_id: adminUserId,
        active: true,
      })
      .select('id')
      .single();

    if (orgError) {
      console.error('[create-organization] Error creating org:', orgError);
      // Cleanup: delete auth user
      await adminClient.auth.admin.deleteUser(adminUserId);
      return new Response(JSON.stringify({ error: 'Erro ao criar organização: ' + orgError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Update profile with full_name (trigger already created the profile)
    await adminClient
      .from('profiles')
      .update({ full_name: admin_name })
      .eq('id', adminUserId);

    // 4. Create organization_member with owner role
    const { error: memberError } = await adminClient
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: adminUserId,
        role: 'owner',
      });

    if (memberError) {
      console.error('[create-organization] Error creating member:', memberError);
      // Cleanup
      await adminClient.from('organizations').delete().eq('id', org.id);
      await adminClient.auth.admin.deleteUser(adminUserId);
      return new Response(JSON.stringify({ error: 'Erro ao criar usuário: ' + memberError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[create-organization] Success:', { orgId: org.id, adminUserId });

    return new Response(JSON.stringify({
      success: true,
      organization_id: org.id,
      admin_user_id: adminUserId,
      temp_password: tempPassword,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[create-organization] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
