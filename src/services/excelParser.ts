import * as XLSX from 'xlsx';

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, string>[];
}

export async function parseExcelFile(file: File): Promise<ParsedSheet> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          throw new Error('Arquivo Excel vazio ou sem dados válidos');
        }

        const headers = Object.keys(jsonData[0]);
        const rows = jsonData.map((row) =>
          headers.reduce((obj, header) => {
            obj[header] = String(row[header] ?? '').trim();
            return obj;
          }, {} as Record<string, string>)
        );

        resolve({ headers, rows });
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Erro ao parsear Excel'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

export function getFileType(file: File): 'csv' | 'xlsx' | 'xls' | 'invalid' {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx')) return 'xlsx';
  if (name.endsWith('.xls')) return 'xls';
  if (name.endsWith('.csv')) return 'csv';
  return 'invalid';
}

export async function parseFile(file: File): Promise<ParsedSheet> {
  const fileType = getFileType(file);
  if (fileType === 'invalid') {
    throw new Error('Formato de arquivo não suportado. Use CSV, XLSX ou XLS.');
  }
  if (fileType === 'csv') {
    // Delegate to CSV parser in importService
    const text = await file.text();
    const { parseCSVText } = await import('@/services/importService');
    const { headers, rows } = parseCSVText(text);
    return { headers, rows };
  }
  return parseExcelFile(file);
}
