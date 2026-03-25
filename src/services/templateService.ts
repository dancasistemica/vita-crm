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
  { key: 'origem', label: 'Origem', required: false, example: 'forms-interesse-comunidade', description: 'Valores válidos: import-app | forms-interesse-comunidade' },
  { key: 'nivel_interesse', label: 'Nível Interesse', required: false, example: 'frio', description: 'Valores válidos: frio | morno | quente' },
  { key: 'etapa_funil', label: 'Etapa Funil', required: false, example: 'lead', description: 'Valores válidos: lead | contato | negociacao | cliente | cancelou' },
  { key: 'interesse_principal', label: 'Interesse Principal', required: false, example: 'Programa Online', description: 'Interesse principal do lead', maxLength: 255 },
  { key: 'dor_principal', label: 'Dor Principal', required: false, example: 'Ansiedade', description: 'Principal dor/problema', maxLength: 255 },
  { key: 'area_tensao', label: 'Área Tensão', required: false, example: 'Ombros', description: 'Quadril, Ombros, Costas, etc.', maxLength: 255 },
  { key: 'objetivo_emocional', label: 'Objetivo Emocional', required: false, example: 'Leveza', description: 'Leveza, Reconexão, Mais Energia, etc.', maxLength: 255 },
  { key: 'tags', label: 'Tags', required: false, example: 'comunidade,embaixadora', description: 'Separar por vírgula, sem espaços' },
  { key: 'observacoes', label: 'Observações', required: false, example: 'Muito engajada', description: 'Texto livre, máx 1000 caracteres', maxLength: 1000 },
];

export const templateExamples: TemplateRow[] = [
  {
    nome: 'Sabrina Campos',
    telefone: '48996880072',
    email: 'sabrina62cia@gmail.com',
    instagram: '',
    cidade: '',
    data_entrada: '',
    origem: 'forms-interesse-comunidade',
    nivel_interesse: 'frio',
    etapa_funil: 'lead',
    interesse_principal: 'Cura',
    dor_principal: 'Rigidez',
    area_tensao: '',
    objetivo_emocional: 'Emoções, Relacionamentos, Trabalho/Dinheiro, Feminino/Sexualidade',
    tags: 'comunidade,embaixadora',
    observacoes: '',
  },
  {
    nome: 'João Silva',
    telefone: '11987654321',
    email: 'joao.silva@gmail.com',
    instagram: '@joaosilva',
    cidade: 'São Paulo',
    data_entrada: '2026-01-15',
    origem: 'import-app',
    nivel_interesse: 'quente',
    etapa_funil: 'negociacao',
    interesse_principal: 'Movimento e leveza',
    dor_principal: 'Tensão nas costas',
    area_tensao: 'Coluna vertebral',
    objetivo_emocional: 'Trabalho/Dinheiro, Autoestima',
    tags: 'free,pagamento-mensal',
    observacoes: 'Cliente em potencial',
  },
];

const instructionsData = [
  ['GUIA DE PREENCHIMENTO - IMPORTAÇÃO DE LEADS', ''],
  ['', ''],
  ['COLUNA', 'VALORES VÁLIDOS / INSTRUÇÕES'],
  ['nome', 'Obrigatório. Nome completo do lead.'],
  ['telefone', 'Opcional. Formato: +55 11 98765-4321 ou 11987654321'],
  ['email', 'Obrigatório. Email válido sem espaços.'],
  ['instagram', 'Opcional. Usuário do Instagram (com ou sem @).'],
  ['cidade', 'Opcional. Nome da cidade.'],
  ['data_entrada', 'Opcional. Formato: YYYY-MM-DD (ex: 2026-01-15)'],
  ['origem', 'Obrigatório. Valores válidos: import-app | forms-interesse-comunidade'],
  ['nivel_interesse', 'Obrigatório. Valores válidos: frio | morno | quente'],
  ['etapa_funil', 'Obrigatório. Valores válidos: lead | contato | negociacao | cliente | cancelou'],
  ['interesse_principal', 'Opcional. Descrição do interesse principal.'],
  ['dor_principal', 'Opcional. Descrição da dor/problema principal.'],
  ['area_tensao', 'Opcional. Área do corpo com tensão.'],
  ['objetivo_emocional', 'Opcional. Objetivos emocionais (separados por vírgula).'],
  ['tags', 'Opcional. Múltiplas tags separadas por vírgula (sem espaços). Valores válidos: comunidade | embaixadora | free | interno | lancamento | lead | pagamento-mensal | pre-venda'],
  ['observacoes', 'Opcional. Notas adicionais sobre o lead.'],
  ['', ''],
  ['EXEMPLOS DE PREENCHIMENTO', ''],
  ['Nome', 'Maria Silva'],
  ['Origem', 'forms-interesse-comunidade'],
  ['Nível de Interesse', 'quente'],
  ['Etapa do Funil', 'negociacao'],
  ['Tags', 'comunidade,pagamento-mensal'],
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
      const value = row[col.key as keyof TemplateRow] || '';
      if (col.key === 'email') {
        obj[col.label] = value.replace(/\s+/g, '');
        return;
      }
      obj[col.label] = value;
    });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(sheetData);
  ws['!cols'] = TEMPLATE_COLUMNS.map(col => ({ wch: Math.max(col.label.length + 4, 18) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
  XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instruções');
  const validValuesSheet = XLSX.utils.aoa_to_sheet([
    ['CAMPO', 'VALORES VÁLIDOS'],
    ['origem', 'import-app,forms-interesse-comunidade'],
    ['nivel_interesse', 'frio,morno,quente'],
    ['etapa_funil', 'lead,contato,negociacao,cliente,cancelou'],
    ['tags', 'comunidade,embaixadora,free,interno,lancamento,lead,pagamento-mensal,pre-venda'],
  ]);
  XLSX.utils.book_append_sheet(wb, validValuesSheet, 'Valores Válidos');
  XLSX.writeFile(wb, `modelo-importacao-leads-${new Date().toISOString().split('T')[0]}.xlsx`);
  console.log('[TemplateService] Template XLSX gerado com sucesso');
  console.log('[TemplateService] Abas: Leads, Instruções, Valores Válidos');
}

export async function copyExampleToClipboard(): Promise<void> {
  const csv = generateCSV(templateExamples);
  await navigator.clipboard.writeText(csv);
}
