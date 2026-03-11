import * as XLSX from 'xlsx';

export interface TemplateRow {
  nome: string;
  telefone: string;
  email: string;
  instagram: string;
  cidade: string;
  data_entrada: string;
  origem: string;
  nivel_interesse: string;
  etapa_funil: string;
  interesse_principal: string;
  dor_principal: string;
  area_tensao: string;
  objetivo_emocional: string;
  tags: string;
  observacoes: string;
}

export const TEMPLATE_COLUMNS = [
  { key: 'nome', label: 'Nome', required: true, example: 'Maria Silva', description: 'Nome completo do lead', maxLength: 255 },
  { key: 'telefone', label: 'Telefone', required: false, example: '11987654321', description: 'DDD + número (apenas números)', maxLength: 11 },
  { key: 'email', label: 'Email', required: false, example: 'maria@email.com', description: 'Email válido (usuario@dominio.com)' },
  { key: 'instagram', label: 'Instagram', required: false, example: '@mariasilva', description: 'Com ou sem @' },
  { key: 'cidade', label: 'Cidade', required: false, example: 'São Paulo', description: 'Cidade do lead', maxLength: 100 },
  { key: 'data_entrada', label: 'Data Entrada', required: false, example: '2026-01-15', description: 'YYYY-MM-DD ou DD/MM/YYYY' },
  { key: 'origem', label: 'Origem', required: false, example: 'Instagram Direct', description: 'Se não existir, será criada automaticamente' },
  { key: 'nivel_interesse', label: 'Nível Interesse', required: false, example: 'Quente', description: 'Frio, Morno ou Quente' },
  { key: 'etapa_funil', label: 'Etapa Funil', required: false, example: 'Interessada', description: 'Se não existir, será criada automaticamente' },
  { key: 'interesse_principal', label: 'Interesse Principal', required: false, example: 'Programa Online', description: 'Interesse principal do lead', maxLength: 255 },
  { key: 'dor_principal', label: 'Dor Principal', required: false, example: 'Ansiedade', description: 'Principal dor/problema', maxLength: 255 },
  { key: 'area_tensao', label: 'Área Tensão', required: false, example: 'Ombros', description: 'Quadril, Ombros, Costas, etc.', maxLength: 255 },
  { key: 'objetivo_emocional', label: 'Objetivo Emocional', required: false, example: 'Leveza', description: 'Leveza, Reconexão, Mais Energia, etc.', maxLength: 255 },
  { key: 'tags', label: 'Tags', required: false, example: 'aula assistida;alta prioridade', description: 'Separar por ; ou , — criadas automaticamente' },
  { key: 'observacoes', label: 'Observações', required: false, example: 'Muito engajada', description: 'Texto livre, máx 1000 caracteres', maxLength: 1000 },
];

export const templateExamples: TemplateRow[] = [
  {
    nome: 'Maria Silva',
    telefone: '11987654321',
    email: 'maria@email.com',
    instagram: '@mariasilva',
    cidade: 'São Paulo',
    data_entrada: '2026-01-15',
    origem: 'Instagram Direct',
    nivel_interesse: 'Quente',
    etapa_funil: 'Interessada',
    interesse_principal: 'Programa Online',
    dor_principal: 'Ansiedade',
    area_tensao: 'Ombros',
    objetivo_emocional: 'Leveza',
    tags: 'aula assistida;alta prioridade',
    observacoes: 'Muito engajada, respondeu rápido',
  },
  {
    nome: 'João Santos',
    telefone: '21998765432',
    email: 'joao@email.com',
    instagram: '@joaosantos',
    cidade: 'Rio de Janeiro',
    data_entrada: '2026-01-10',
    origem: 'Indicação',
    nivel_interesse: 'Morno',
    etapa_funil: 'Conexão Inicial',
    interesse_principal: 'Mentoria',
    dor_principal: 'Falta de foco',
    area_tensao: 'Costas',
    objetivo_emocional: 'Reconexão',
    tags: 'follow-up',
    observacoes: 'Respondeu uma vez, precisa de follow-up',
  },
  {
    nome: 'Ana Costa',
    telefone: '85988776655',
    email: 'ana@email.com',
    instagram: '@anacosta',
    cidade: 'Fortaleza',
    data_entrada: '2026-01-12',
    origem: 'Aula Gratuita',
    nivel_interesse: 'Frio',
    etapa_funil: 'Novo Contato',
    interesse_principal: 'Comunidade',
    dor_principal: 'Falta de energia',
    area_tensao: 'Pernas',
    objetivo_emocional: 'Mais energia',
    tags: 'aula assistida',
    observacoes: 'Assistiu aula gratuita, não respondeu ainda',
  },
];

export function generateCSV(rows: TemplateRow[]): string {
  const headers = TEMPLATE_COLUMNS.map(c => c.label);

  const csvRows = rows.map(row => {
    const values = TEMPLATE_COLUMNS.map(col => {
      const val = row[col.key as keyof TemplateRow] || '';
      return `"${val.replace(/"/g, '""')}"`;
    });
    return values.join(',');
  });

  return '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
}

export function downloadTemplate(): void {
  const csv = generateCSV(templateExamples);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `modelo-importacao-leads-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadTemplateXLSX(): void {
  const sheetData = templateExamples.map(row => {
    const obj: Record<string, string> = {};
    TEMPLATE_COLUMNS.forEach(col => {
      obj[col.label] = row[col.key as keyof TemplateRow] || '';
    });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(sheetData);
  ws['!cols'] = TEMPLATE_COLUMNS.map(col => ({ wch: Math.max(col.label.length + 4, 18) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  XLSX.writeFile(wb, `modelo-importacao-leads-${new Date().toISOString().split('T')[0]}.xlsx`);
}

export async function copyExampleToClipboard(): Promise<void> {
  const csv = generateCSV(templateExamples);
  await navigator.clipboard.writeText(csv);
}
