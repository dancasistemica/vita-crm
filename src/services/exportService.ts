import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  value: string;
  label: string;
}

export interface ExportOptions {
  type: 'leads' | 'clients';
  format: 'csv' | 'pdf';
  columns: ExportColumn[];
  data: Record<string, any>[];
}

export function exportToCSV(options: ExportOptions): void {
  const { columns, data } = options;
  const BOM = '\uFEFF';
  const headers = columns.map(c => c.label).join(',');

  const rows = data.map(item =>
    columns.map(col => {
      const val = item[col.value];
      if (val === null || val === undefined) return '';
      const str = Array.isArray(val) ? val.join('; ') : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csv = BOM + [headers, ...rows].join('\n');
  downloadFile(csv, `export-${options.type}-${Date.now()}.csv`, 'text/csv;charset=utf-8');
}

export function exportToPDF(options: ExportOptions): void {
  const { columns, data } = options;
  const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait' });

  doc.setFontSize(16);
  doc.text(`Relatório de ${options.type === 'leads' ? 'Leads' : 'Clientes'}`, 14, 15);
  doc.setFontSize(10);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 23);
  doc.text(`Total: ${data.length} registros`, 14, 29);

  const headers = columns.map(c => c.label);
  const bodyRows = data.map(item =>
    columns.map(col => {
      const val = item[col.value];
      if (val === null || val === undefined) return '';
      return Array.isArray(val) ? val.join(', ') : String(val);
    })
  );

  autoTable(doc, {
    head: [headers],
    body: bodyRows,
    startY: 35,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: {
      fillColor: [232, 121, 160],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [250, 248, 246] },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  doc.save(`export-${options.type}-${Date.now()}.pdf`);
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
