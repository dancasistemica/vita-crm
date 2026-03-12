import { supabase } from '@/integrations/supabase/client';

interface CreateOrgData {
  name: string;
  contact_email: string;
  phone?: string;
  website?: string;
  description?: string;
  plan_id: string;
  admin_name: string;
  admin_email: string;
}

interface CreateOrgResult {
  organization_id: string;
  admin_user_id: string;
  temp_password: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

export async function createOrganization(data: CreateOrgData): Promise<CreateOrgResult> {
  console.log('[OrganizationService] Criando organização:', data.name);

  const slug = slugify(data.name) + '-' + Date.now().toString(36);

  const { data: result, error } = await supabase.functions.invoke('create-organization', {
    body: {
      name: data.name,
      slug,
      contact_email: data.contact_email,
      phone: data.phone || null,
      website: data.website || null,
      description: data.description || null,
      plan_id: data.plan_id || null,
      admin_name: data.admin_name,
      admin_email: data.admin_email,
    },
  });

  if (error) {
    console.error('[OrganizationService] Edge function error:', error);
    throw new Error(error.message || 'Erro ao criar organização');
  }

  if (!result?.success) {
    throw new Error(result?.error || 'Erro ao criar organização');
  }

  console.log('[OrganizationService] Organização criada com sucesso:', result.organization_id);
  return result as CreateOrgResult;
}
