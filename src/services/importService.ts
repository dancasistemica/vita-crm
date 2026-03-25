import { Lead } from '@/types/crm';
import { supabase } from '@/integrations/supabase/client';

export interface CSVRow {
  [key: string]: string;
}

export interface ImportValidationResult {
  row: number;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: Partial<Lead>;
}

const COLUMN_MAP: Record<string, keyof Lead> = {
  'nome': 'name', 'name': 'name',
  'telefone': 'phone', 'phone': 'phone',
  'email': 'email',
  'instagram': 'instagram', 'ig': 'instagram',
  'cidade': 'city', 'city': 'city',
  'data entrada': 'entryDate', 'data_entrada': 'entryDate', 'entry date': 'entryDate', 'entrydate': 'entryDate',
  'origem': 'origin', 'origin': 'origin',
  'nível interesse': 'interestLevel', 'nivel interesse': 'interestLevel', 'nível_interesse': 'interestLevel', 'interest level': 'interestLevel', 'interestlevel': 'interestLevel',
  'etapa funil': 'pipelineStage', 'etapa_funil': 'pipelineStage', 'funnel stage': 'pipelineStage', 'funnelstage': 'pipelineStage', 'pipelinestage': 'pipelineStage',
  'interesse principal': 'mainInterest', 'main interest': 'mainInterest', 'interesse_principal': 'mainInterest', 'maininterest': 'mainInterest',
  'dor principal': 'notes' as any, 'main pain': 'notes' as any, 'dor_principal': 'notes' as any, 'painpoint': 'notes' as any,
  'área tensão': 'notes' as any, 'area tensão': 'notes' as any, 'body tension': 'notes' as any, 'área_tensão': 'notes' as any, 'bodytensionarea': 'notes' as any,
  'objetivo emocional': 'notes' as any, 'emotional goal': 'notes' as any, 'objetivo_emocional': 'notes' as any, 'emotionalgoal': 'notes' as any,
  'tags': 'tags' as any,
  'observações': 'notes', 'observacoes': 'notes', 'notes': 'notes', 'notas': 'notes',
  'responsável': 'responsible', 'responsavel': 'responsible', 'responsible': 'responsible',
};

export function parseCSVText(text: string): { headers: string[]; rows: CSVRow[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj: CSVRow = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });

  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function suggestMapping(csvHeaders: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of csvHeaders) {
    const normalized = header.toLowerCase().trim();
    const mapped = COLUMN_MAP[normalized];
    if (mapped) {
      mapping[header] = mapped;
    }
  }
  return mapping;
}

export function getCRMFields(): { value: string; label: string }[] {
  return [
    { value: '_ignore', label: '— Ignorar —' },
    { value: 'name', label: 'Nome' },
    { value: 'phone', label: 'Telefone' },
    { value: 'email', label: 'Email' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'city', label: 'Cidade' },
    { value: 'entryDate', label: 'Data de Entrada' },
    { value: 'origin', label: 'Origem' },
    { value: 'interestLevel', label: 'Nível de Interesse' },
    { value: 'pipelineStage', label: 'Etapa do Funil' },
    { value: 'mainInterest', label: 'Interesse Principal' },
    { value: 'painPoint', label: 'Dor Principal' },
    { value: 'bodyTensionArea', label: 'Área de Tensão' },
    { value: 'emotionalGoal', label: 'Objetivo Emocional' },
    { value: 'tags', label: 'Tags' },
    { value: 'notes', label: 'Observações' },
    { value: 'responsible', label: 'Responsável' },
  ];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email: string) => email.replace(/\s+/g, '').trim().toLowerCase();

export const parseTags = (tagsInput: string | string[] | null | undefined): string[] => {
  if (!tagsInput) return [];
  const raw = Array.isArray(tagsInput) ? tagsInput.join(',') : String(tagsInput);

  return raw
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0);
};

export function validateRows(
  rows: CSVRow[],
  mapping: Record<string, string>,
  existingLeads: Lead[]
): ImportValidationResult[] {
  const results: ImportValidationResult[] = [];
  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();

  existingLeads.forEach(l => {
    if (l.email) seenEmails.add(l.email.toLowerCase());
    if (l.phone) seenPhones.add(l.phone);
  });

  for (let i = 0; i < Math.min(rows.length, 1000); i++) {
    const row = rows[i];
    const data: Record<string, any> = {};

    for (const [csvCol, crmField] of Object.entries(mapping)) {
      if (!crmField) continue;
      const val = row[csvCol] || '';
      if (crmField === 'tags') {
        data.tags = parseTags(val);
      } else if (crmField === 'email') {
        data.email = normalizeEmail(val);
      } else {
        data[crmField] = val;
      }
    }

    // Validate required
    if (!data.name) {
      results.push({ row: i + 2, status: 'error', message: 'Nome é obrigatório' });
      continue;
    }
    if (!data.email) {
      results.push({ row: i + 2, status: 'error', message: 'Email é obrigatório' });
      continue;
    }

    // Validate email
    if (data.email && !EMAIL_REGEX.test(data.email)) {
      results.push({ row: i + 2, status: 'error', message: `Email inválido: ${data.email}` });
      continue;
    }

    // Check duplicates
    if (data.email && seenEmails.has(data.email.toLowerCase())) {
      results.push({ row: i + 2, status: 'warning', message: `Email duplicado: ${data.email}` });
      continue;
    }
    if (data.phone && seenPhones.has(data.phone.replace(/\D/g, ''))) {
      results.push({ row: i + 2, status: 'warning', message: `Telefone duplicado: ${data.phone}` });
      continue;
    }

    // Track seen
    if (data.email) seenEmails.add(data.email.toLowerCase());
    if (data.phone) seenPhones.add(data.phone.replace(/\D/g, ''));

    // Normalize phone
    if (data.phone) {
      data.phone = data.phone.replace(/\D/g, '');
    }

    // Normalize date
    if (data.entryDate) {
      // Try DD/MM/YYYY
      const ddmmyyyy = data.entryDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (ddmmyyyy) {
        data.entryDate = `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
      }
    } else {
      data.entryDate = new Date().toISOString().split('T')[0];
    }

    if (!data.tags) data.tags = [];
    if (!data.interestLevel) data.interestLevel = 'frio';
    if (!data.pipelineStage) data.pipelineStage = 'lead';

    results.push({ row: i + 2, status: 'success', message: 'Válido', data: data as Partial<Lead> });
  }

  return results;
}

export function getNewOptions(
  validationResults: ImportValidationResult[],
  existingOrigins: string[],
  existingInterestLevels: { value: string }[],
  existingTags: { name: string }[]
) {
  const newOrigins = new Set<string>();
  const newInterestLevels = new Set<string>();
  const newTags = new Set<string>();

  const originsLower = new Set(existingOrigins.map(o => o.toLowerCase()));
  const levelsLower = new Set(existingInterestLevels.map(l => l.value.toLowerCase()));
  const tagsLower = new Set(existingTags.map(t => t.name.toLowerCase()));

  for (const r of validationResults) {
    if (r.status !== 'success' || !r.data) continue;
    if (r.data.origin && !originsLower.has(r.data.origin.toLowerCase())) {
      newOrigins.add(r.data.origin);
    }
    if (r.data.interestLevel && !levelsLower.has(r.data.interestLevel.toLowerCase())) {
      newInterestLevels.add(r.data.interestLevel);
    }
    if (r.data.tags) {
      for (const t of r.data.tags) {
        if (!tagsLower.has(t.toLowerCase())) {
          newTags.add(t);
        }
      }
    }
  }

  return { newOrigins: [...newOrigins], newInterestLevels: [...newInterestLevels], newTags: [...newTags] };
}

const ensureOrigin = async (
  originName: string,
  organizationId: string,
  originCache: Map<string, { id: string; name: string }>
) => {
  const normalized = originName.toLowerCase();
  if (originCache.has(normalized)) return originCache.get(normalized)!;

  const { data: existing } = await supabase
    .from('lead_origins')
    .select('id, name')
    .eq('organization_id', organizationId)
    .ilike('name', originName)
    .maybeSingle();

  if (existing) {
    originCache.set(existing.name.toLowerCase(), existing);
    return existing;
  }

  const { data: created, error } = await supabase
    .from('lead_origins')
    .insert({ name: originName, organization_id: organizationId })
    .select('id, name')
    .single();

  if (error || !created) {
    console.error('[ImportService] Erro ao criar origem:', error);
    return null;
  }

  originCache.set(created.name.toLowerCase(), created);
  console.log(`[ImportService] Origem criada: ${created.name}`);
  return created;
};

const ensureInterestLevel = async (
  levelValue: string,
  organizationId: string,
  levelCache: Map<string, { id: string; value: string }>
) => {
  const normalized = levelValue.toLowerCase();
  if (levelCache.has(normalized)) return levelCache.get(normalized)!;

  const { data: existing } = await supabase
    .from('interest_levels')
    .select('id, value')
    .eq('organization_id', organizationId)
    .ilike('value', levelValue)
    .maybeSingle();

  if (existing) {
    levelCache.set(existing.value.toLowerCase(), existing);
    return existing;
  }

  const { data: created, error } = await supabase
    .from('interest_levels')
    .insert({ value: levelValue, label: levelValue, organization_id: organizationId })
    .select('id, value')
    .single();

  if (error || !created) {
    console.error('[ImportService] Erro ao criar nível de interesse:', error);
    return null;
  }

  levelCache.set(created.value.toLowerCase(), created);
  console.log(`[ImportService] Nível de interesse criado: ${created.value}`);
  return created;
};

const ensureTag = async (
  tagName: string,
  organizationId: string,
  tagCache: Map<string, { id: string; name: string }>
) => {
  const normalized = tagName.toLowerCase();
  if (tagCache.has(normalized)) return tagCache.get(normalized)!;

  const { data: existing } = await supabase
    .from('tags')
    .select('id, name')
    .eq('organization_id', organizationId)
    .ilike('name', tagName)
    .maybeSingle();

  if (existing) {
    tagCache.set(existing.name.toLowerCase(), existing);
    return existing;
  }

  const { data: created, error } = await supabase
    .from('tags')
    .insert({ name: tagName, color: 'hsl(var(--primary))', organization_id: organizationId })
    .select('id, name')
    .single();

  if (error || !created) {
    console.error('[ImportService] Erro ao criar tag:', error);
    return null;
  }

  tagCache.set(created.name.toLowerCase(), created);
  console.log(`[ImportService] Tag criada: ${created.name}`);
  return created;
};

const ensurePipelineStage = async (
  stageValue: string,
  organizationId: string,
  stageByName: Map<string, { id: string; name: string }>,
  stageById: Map<string, { id: string; name: string }>,
  nextSortOrder: () => number
) => {
  const normalized = stageValue.toLowerCase();
  if (stageById.has(stageValue)) return stageById.get(stageValue)!;
  if (stageByName.has(normalized)) return stageByName.get(normalized)!;

  const { data: existing } = await supabase
    .from('pipeline_stages')
    .select('id, name')
    .eq('organization_id', organizationId)
    .ilike('name', stageValue)
    .maybeSingle();

  if (existing) {
    stageByName.set(existing.name.toLowerCase(), existing);
    stageById.set(existing.id, existing);
    return existing;
  }

  const { data: created, error } = await supabase
    .from('pipeline_stages')
    .insert({ name: stageValue, organization_id: organizationId, sort_order: nextSortOrder() })
    .select('id, name')
    .single();

  if (error || !created) {
    console.error('[ImportService] Erro ao criar etapa do funil:', error);
    return null;
  }

  stageByName.set(created.name.toLowerCase(), created);
  stageById.set(created.id, created);
  console.log(`[ImportService] Etapa do funil criada: ${created.name}`);
  return created;
};

export const linkTagsToLead = async (
  leadId: string,
  tagNames: string[],
  organizationId: string,
  tagCache?: Map<string, { id: string; name: string }>
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (const tagName of tagNames) {
    try {
      const tag = tagCache
        ? await ensureTag(tagName, organizationId, tagCache)
        : await ensureTag(tagName, organizationId, new Map());

      if (!tag) {
        console.warn(`[ImportService] Tag não encontrada/criada: ${tagName}`);
        failed++;
        continue;
      }

      const { error: linkError } = await supabase
        .from('lead_tags')
        .insert({
          lead_id: leadId,
          tag_id: tag.id,
        });

      if (linkError) {
        console.warn(`[ImportService] Erro ao vincular tag "${tagName}":`, linkError);
        failed++;
      } else {
        success++;
        console.log(`[ImportService] Tag "${tagName}" vinculada ao lead ${leadId}`);
      }
    } catch (error) {
      console.error(`[ImportService] Erro ao processar tag "${tagName}":`, error);
      failed++;
    }
  }

  return { success, failed };
};

export const transitionLeadToClient = async (
  leadId: string,
  pipelineStage: string,
  organizationId: string
): Promise<boolean> => {
  if (pipelineStage.toLowerCase() !== 'cliente') return false;

  try {
    console.log(`[ImportService] Convertendo lead ${leadId} para cliente...`);

    const { data: lead, error: fetchError } = await supabase
      .from('leads')
      .select('id, email, name, phone')
      .eq('id', leadId)
      .single();

    if (fetchError || !lead) {
      console.warn(`[ImportService] Lead não encontrado: ${leadId}`);
      return false;
    }

    const { data: client, error: createError } = await supabase
      .from('clients')
      .insert({
        organization_id: organizationId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        lead_id: leadId,
      })
      .select()
      .single();

    if (createError) {
      console.error('[ImportService] Erro ao criar cliente:', createError);
      return false;
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update({
        client_id: client.id,
        pipeline_stage: 'cliente',
      })
      .eq('id', leadId);

    if (updateError) {
      console.error('[ImportService] Erro ao atualizar lead:', updateError);
      return false;
    }

    console.log(`[ImportService] Lead ${leadId} convertido para cliente ${client.id}`);
    return true;
  } catch (error) {
    console.error('[ImportService] Erro na transição lead→cliente:', error);
    return false;
  }
};

export interface ImportResult {
  created: number;
  updated: number;
  converted: number;
  errors: Array<{ linha: number; erro: string }>;
}

export const processImportedLeads = async (
  organizationId: string,
  rows: any[]
): Promise<ImportResult> => {
  const result: ImportResult = {
    created: 0,
    updated: 0,
    converted: 0,
    errors: [],
  };

  console.log(`[ImportService] Iniciando importação de ${rows.length} leads...`);

  const [originsRes, levelsRes, tagsRes, stagesRes] = await Promise.all([
    supabase.from('lead_origins').select('id, name').eq('organization_id', organizationId),
    supabase.from('interest_levels').select('id, value').eq('organization_id', organizationId),
    supabase.from('tags').select('id, name').eq('organization_id', organizationId),
    supabase.from('pipeline_stages').select('id, name, sort_order').eq('organization_id', organizationId),
  ]);

  const originsCache = new Map((originsRes.data || []).map(o => [o.name.toLowerCase(), o]));
  const levelsCache = new Map((levelsRes.data || []).map(l => [l.value.toLowerCase(), l]));
  const tagsCache = new Map((tagsRes.data || []).map(t => [t.name.toLowerCase(), t]));
  const stageByName = new Map((stagesRes.data || []).map(s => [s.name.toLowerCase(), s]));
  const stageById = new Map((stagesRes.data || []).map(s => [s.id, s]));
  let stageSort = Math.max(0, ...(stagesRes.data || []).map(s => s.sort_order || 0));
  const nextSortOrder = () => {
    stageSort += 1;
    return stageSort;
  };

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index] || {};
    const lineNumber = typeof row.__lineNumber === 'number' ? row.__lineNumber : index + 2;

    try {
      const rawEmail = String(row.email || '');
      const normalizedEmail = normalizeEmail(rawEmail);

      if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
        result.errors.push({
          linha: lineNumber,
          erro: `Email inválido: ${rawEmail}`,
        });
        continue;
      }

      const originName = String(row.origem || '').trim();
      if (originName) {
        const originRecord = await ensureOrigin(originName, organizationId, originsCache);
        if (!originRecord) {
          result.errors.push({
            linha: lineNumber,
            erro: `Erro ao criar/validar origem: ${originName}`,
          });
          continue;
        }
      }

      const interestLevel = String(row.nivel_interesse || '').trim();
      if (interestLevel) {
        const levelRecord = await ensureInterestLevel(interestLevel, organizationId, levelsCache);
        if (!levelRecord) {
          result.errors.push({
            linha: lineNumber,
            erro: `Erro ao criar/validar nível de interesse: ${interestLevel}`,
          });
          continue;
        }
      }

      const stageInput = String(row.etapa_funil || '').trim();
      let stageRecord: { id: string; name: string } | null = null;
      if (stageInput) {
        stageRecord = await ensurePipelineStage(stageInput, organizationId, stageByName, stageById, nextSortOrder);
        if (!stageRecord) {
          result.errors.push({
            linha: lineNumber,
            erro: `Erro ao criar/validar etapa do funil: ${stageInput}`,
          });
          continue;
        }
      }

      const tagNames = parseTags(row.tags || '');
      for (const tagName of tagNames) {
        await ensureTag(tagName, organizationId, tagsCache);
      }

      const leadPayload = {
        organization_id: organizationId,
        name: String(row.nome || '').trim(),
        phone: String(row.telefone || '').replace(/\D/g, ''),
        email: normalizedEmail,
        instagram: String(row.instagram || '').trim(),
        city: String(row.cidade || '').trim(),
        entry_date: String(row.data_entrada || '').trim() || new Date().toISOString().split('T')[0],
        origin: originName || null,
        interest_level: interestLevel || null,
        pipeline_stage: stageRecord?.id || stageInput || null,
        main_interest: String(row.interesse_principal || '').trim(),
        notes: String(row.observacoes || '').trim(),
        tags: tagNames,
        custom_data: {
          pain_point: String(row.dor_principal || '').trim(),
          body_tension_area: String(row.area_tensao || '').trim(),
          emotional_goal: String(row.objetivo_emocional || '').trim(),
        },
      };

      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('email', normalizedEmail)
        .maybeSingle();

      let leadId: string;

      if (existingLead) {
        const { organization_id: _orgId, ...updatePayload } = leadPayload;
        const { data: updated, error: updateError } = await supabase
          .from('leads')
          .update(updatePayload)
          .eq('id', existingLead.id)
          .select('id')
          .single();

        if (updateError || !updated) {
          result.errors.push({
            linha: lineNumber,
            erro: `Erro ao atualizar: ${updateError?.message || 'erro desconhecido'}`,
          });
          continue;
        }

        leadId = updated.id;
        result.updated++;
        console.log(`[ImportService] Lead atualizado: ${normalizedEmail}`);
      } else {
        const { data: created, error: createError } = await supabase
          .from('leads')
          .insert(leadPayload)
          .select('id')
          .single();

        if (createError || !created) {
          result.errors.push({
            linha: lineNumber,
            erro: `Erro ao criar: ${createError?.message || 'erro desconhecido'}`,
          });
          continue;
        }

        leadId = created.id;
        result.created++;
        console.log(`[ImportService] Lead criado: ${normalizedEmail}`);
      }

      if (tagNames.length > 0) {
        await linkTagsToLead(leadId, tagNames, organizationId, tagsCache);
      }

      const stageName = stageRecord?.name || stageInput;
      if (stageName && stageName.toLowerCase() === 'cliente') {
        const converted = await transitionLeadToClient(leadId, stageName, organizationId);
        if (converted) result.converted++;
      }
    } catch (error) {
      result.errors.push({
        linha: lineNumber,
        erro: `Erro inesperado: ${error instanceof Error ? error.message : String(error)}`,
      });
      console.error(`[ImportService] Erro na linha ${lineNumber}:`, error);
    }
  }

  console.log('[ImportService] Resumo:', result);
  return result;
};
