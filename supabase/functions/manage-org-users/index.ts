import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const callerId = claimsData.claims.sub as string;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action, organization_id } = body;

    if (!organization_id) {
      return new Response(JSON.stringify({ error: 'organization_id obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check caller is admin/owner of the org OR superadmin
    const { data: saCheck } = await adminClient
      .from('superadmin_roles')
      .select('id')
      .eq('user_id', callerId)
      .maybeSingle();

    if (!saCheck) {
      const { data: callerMember } = await adminClient
        .from('organization_members')
        .select('role')
        .eq('user_id', callerId)
        .eq('organization_id', organization_id)
        .maybeSingle();

      if (!callerMember || !['owner', 'admin'].includes(callerMember.role)) {
        return new Response(JSON.stringify({ error: 'Sem permissão' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ---- CREATE USER ----
    if (action === 'create') {
      const { email, full_name, phone, role } = body;
      if (!email || !full_name) {
        return new Response(JSON.stringify({ error: 'Email e nome são obrigatórios' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const validRoles = ['owner', 'admin', 'vendedor', 'member'];
      const userRole = validRoles.includes(role) ? role : 'member';

      // Check if email already exists in auth
      const { data: existingUsers } = await adminClient.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === email);

      if (existingUser) {
        // Check if already member of this org
        const { data: existingMember } = await adminClient
          .from('organization_members')
          .select('id')
          .eq('user_id', existingUser.id)
          .eq('organization_id', organization_id)
          .maybeSingle();

        if (existingMember) {
          return new Response(JSON.stringify({ error: 'Usuário já pertence a esta organização' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Add existing user to org
        const { error: memberError } = await adminClient
          .from('organization_members')
          .insert({ organization_id, user_id: existingUser.id, role: userRole });

        if (memberError) {
          return new Response(JSON.stringify({ error: 'Erro ao adicionar usuário: ' + memberError.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, user_id: existingUser.id, existing: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate temp password
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
      let tempPassword = '';
      for (let i = 0; i < 12; i++) {
        tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Create auth user
      const { data: authData, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: 'Erro ao criar usuário: ' + createError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const newUserId = authData.user.id;

      // Update profile
      await adminClient
        .from('profiles')
        .update({ full_name, phone: phone || null })
        .eq('id', newUserId);

      // Add to org
      const { error: memberError } = await adminClient
        .from('organization_members')
        .insert({ organization_id, user_id: newUserId, role: userRole });

      if (memberError) {
        await adminClient.auth.admin.deleteUser(newUserId);
        return new Response(JSON.stringify({ error: 'Erro ao criar membro: ' + memberError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Send password reset email so user can set their own password
      await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email,
      });

      return new Response(JSON.stringify({ success: true, user_id: newUserId, temp_password: tempPassword }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- DELETE USER ----
    if (action === 'delete') {
      const { user_id } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: 'user_id obrigatório' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if user is the owner
      const { data: org } = await adminClient
        .from('organizations')
        .select('owner_id')
        .eq('id', organization_id)
        .maybeSingle();

      if (org?.owner_id === user_id) {
        return new Response(JSON.stringify({ error: 'Não é possível remover o proprietário da organização' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Remove from org
      await adminClient
        .from('organization_members')
        .delete()
        .eq('user_id', user_id)
        .eq('organization_id', organization_id);

      // Check if user is member of any other org
      const { data: otherMemberships } = await adminClient
        .from('organization_members')
        .select('id')
        .eq('user_id', user_id);

      // Only delete auth user if not member of any org
      if (!otherMemberships || otherMemberships.length === 0) {
        await adminClient.auth.admin.deleteUser(user_id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- RESET PASSWORD ----
    if (action === 'reset_password') {
      const { email } = body;
      if (!email) {
        return new Response(JSON.stringify({ error: 'Email obrigatório' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[manage-org-users] Error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
