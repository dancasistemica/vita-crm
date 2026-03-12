import { supabase } from '@/integrations/supabase/client';

// Organizations
export async function getAllOrganizations() {
  const { data, error } = await supabase
    .from('organizations')
    .select('*, organization_members(user_id, role)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateOrgStatus(orgId: string, active: boolean) {
  const { error } = await supabase
    .from('organizations')
    .update({ active })
    .eq('id', orgId);

  if (error) throw error;
}

export async function updateOrgPlan(orgId: string, planId: string | null) {
  const { error } = await supabase
    .from('organizations')
    .update({ plan_id: planId } as any)
    .eq('id', orgId);

  if (error) throw error;
}

// Plans
export async function getAllPlans() {
  const { data, error } = await supabase
    .from('organization_plans')
    .select('*')
    .order('value', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createPlan(plan: {
  name: string;
  value: number;
  period: string;
  max_users: number;
  max_leads?: number | null;
  max_integrations?: number | null;
  description?: string | null;
}) {
  const { error } = await supabase
    .from('organization_plans')
    .insert([plan]);

  if (error) throw error;
}

export async function deletePlan(planId: string) {
  const { error } = await supabase
    .from('organization_plans')
    .delete()
    .eq('id', planId);

  if (error) throw error;
}

// Superadmin users
export async function getSuperadmins() {
  const { data, error } = await supabase
    .from('superadmin_roles')
    .select('id, user_id, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Fetch profiles for each superadmin
  if (data && data.length > 0) {
    const userIds = data.map(d => d.user_id);
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    if (profError) throw profError;

    return data.map(sa => {
      const profile = profiles?.find(p => p.id === sa.user_id);
      return {
        ...sa,
        full_name: profile?.full_name || '',
        email: profile?.email || '',
      };
    });
  }

  return [];
}

export async function addSuperadminByEmail(email: string) {
  // Find profile by email
  const { data: profile, error: profError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (profError) throw profError;
  if (!profile) throw new Error('Nenhum usuário encontrado com esse email');

  // Insert into superadmin_roles
  const { error } = await supabase
    .from('superadmin_roles')
    .insert([{ user_id: profile.id }]);

  if (error) {
    if (error.code === '23505') throw new Error('Este usuário já é superadmin');
    throw error;
  }
}

export async function removeSuperadmin(roleId: string) {
  const { error } = await supabase
    .from('superadmin_roles')
    .delete()
    .eq('id', roleId);

  if (error) throw error;
}

// Update organization details
export async function updateOrganization(orgId: string, data: Record<string, any>) {
  const { error } = await supabase
    .from('organizations')
    .update(data as any)
    .eq('id', orgId);

  if (error) throw error;
}

// Delete organization
export async function deleteOrganization(orgId: string) {
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', orgId);

  if (error) throw error;
}
