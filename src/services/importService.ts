import { Lead } from '@/types/crm';

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
  'dor principal': 'painPoint', 'main pain': 'painPoint', 'dor_principal': 'painPoint', 'painpoint': 'painPoint',
  'área tensão': 'bodyTensionArea', 'area tensão': 'bodyTensionArea', 'body tension': 'bodyTensionArea', 'área_tensão': 'bodyTensionArea', 'bodytensionarea': 'bodyTensionArea',
  'objetivo emocional': 'emotionalGoal', 'emotional goal': 'emotionalGoal', 'objetivo_emocional': 'emotionalGoal', 'emotionalgoal': 'emotionalGoal',
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
        data.tags = val.split(/[;,]/).map((t: string) => t.trim()).filter(Boolean);
      } else {
        data[crmField] = val;
      }
    }

    // Validate required
    if (!data.name) {
      results.push({ row: i + 2, status: 'error', message: 'Nome é obrigatório' });
      continue;
    }
    if (!data.email && !data.phone) {
      results.push({ row: i + 2, status: 'error', message: 'Email ou Telefone é obrigatório' });
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
    if (!data.pipelineStage) data.pipelineStage = '1';

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
