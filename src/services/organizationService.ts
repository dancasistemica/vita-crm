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

async function extractFunctionErrorMessage(error: unknown): Promise<string> {
  if (!error || typeof error !== 'object') return 'Erro ao criar organização';

  const withContext = error as { context?: Response; message?: string };

  if (withContext.context) {
    try {
      const payload = await withContext.context.clone().json();
      if (payload?.error && typeof payload.error === 'string') {
        return payload.error;
      }
    } catch {
      // ignore parse errors and fallback to message parsing
    }
  }

  const rawMessage = withContext.message;
  if (rawMessage) {
    const jsonMatch = rawMessage.match(/\{[\s\S]*\}$/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed?.error && typeof parsed.error === 'string') {
          return parsed.error;
        }
      } catch {
        // ignore parse errors
      }
    }

    return rawMessage;
  }

  return 'Erro ao criar organização';
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
    throw new Error(await extractFunctionErrorMessage(error));
  }

  if (!result?.success) {
    throw new Error(result?.error || 'Erro ao criar organização');
  }

  console.log('[OrganizationService] Organização criada com sucesso:', result.organization_id);
  return result as CreateOrgResult;
}
