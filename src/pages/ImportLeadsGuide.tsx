import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Copy, Check, FileSpreadsheet, Info, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TEMPLATE_COLUMNS, templateExamples, downloadTemplate, downloadTemplateXLSX, copyExampleToClipboard } from '@/services/templateService';

const PREVIEW_COLS = ['nome', 'telefone', 'email', 'origem', 'nivel_interesse', 'dor_principal'] as const;

export default function ImportLeadsGuide() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyExampleToClipboard();
      setCopied(true);
      toast.success('Exemplo copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar. Tente novamente.');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Importar Leads</h1>
        <p className="text-muted-foreground mt-1">Guia passo a passo para importar seus leads via CSV ou Excel</p>
      </div>

      {/* Section 1: Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Informações do Arquivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              ['Formato', 'CSV, XLSX ou XLS (recomendado: XLSX)'],
              ['Tamanho máximo', '10MB'],
              ['Máximo por importação', '1.000 leads'],
              ['Campos obrigatórios', 'Nome + (Email OU Telefone)'],
              ['Auto-cadastro', 'Opções faltantes são criadas automaticamente'],
              ['Duplicatas', 'Detectadas por email/telefone e não importadas'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span><strong className="text-foreground">{label}:</strong>{' '}<span className="text-muted-foreground">{value}</span></span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Preview do Modelo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/10 hover:bg-primary/10">
                  {PREVIEW_COLS.map(key => {
                    const col = TEMPLATE_COLUMNS.find(c => c.key === key)!;
                    return (
                      <TableHead key={key} className="text-primary font-semibold whitespace-nowrap">
                        {col.label}
                        {col.required && <span className="text-destructive ml-1">*</span>}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {templateExamples.map((row, i) => (
                  <TableRow key={i}>
                    {PREVIEW_COLS.map(key => (
                      <TableCell key={key} className="whitespace-nowrap text-sm">
                        {row[key as keyof typeof row]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground px-6 py-3">
            * Mostrando 6 de 15 colunas. O modelo completo inclui todas as colunas.
          </p>
        </CardContent>
      </Card>

      {/* Column reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Referência de Colunas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coluna</TableHead>
                  <TableHead>Obrigatório</TableHead>
                  <TableHead>Exemplo</TableHead>
                  <TableHead className="hidden md:table-cell">Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TEMPLATE_COLUMNS.map(col => (
                  <TableRow key={col.key}>
                    <TableCell className="font-medium whitespace-nowrap">{col.label}</TableCell>
                    <TableCell>
                      {col.required ? (
                        <Badge variant="destructive" className="text-xs">Sim</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Não</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono whitespace-nowrap">{col.example}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{col.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Download */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Baixar Modelo
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={downloadTemplate} className="flex-1 gap-2" size="lg">
              <Download className="h-4 w-4" />
              Baixar Modelo CSV
            </Button>
            <Button onClick={handleCopy} variant="outline" className="flex-1 gap-2" size="lg">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiado!' : 'Copiar Exemplo'}
            </Button>
          </div>

          <div className="mt-6 space-y-2">
            <h4 className="font-medium text-foreground">Passo a passo:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Baixe o arquivo modelo acima</li>
              <li>Abra em Excel ou Google Sheets</li>
              <li>Preencha com seus dados (mantenha os cabeçalhos)</li>
              <li>Salve como CSV (Arquivo → Salvar como → CSV)</li>
              <li>Vá para <strong className="text-foreground">Leads → Importar CSV</strong></li>
              <li>Selecione o arquivo</li>
              <li>Mapeie as colunas (se necessário)</li>
              <li>Confirme a importação</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: FAQ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Dúvidas e Dicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="faq">
              <AccordionTrigger>❓ Dúvidas Frequentes</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-sm">
                  {[
                    ['Qual é o formato correto para telefone?', 'Apenas números, sem formatação. Exemplo: 11987654321 (DDD + número).'],
                    ['Posso deixar campos em branco?', 'Sim, apenas Nome e (Email ou Telefone) são obrigatórios. Todos os outros são opcionais.'],
                    ['E se tiver um campo que não está no modelo?', 'Colunas extras serão ignoradas durante a importação.'],
                    ['Como separar múltiplas tags?', 'Use ponto e vírgula (;) ou vírgula (,). Exemplo: tag1;tag2;tag3'],
                    ['O que acontece com emails duplicados?', 'O sistema detecta duplicatas por email/telefone e não importa. Você verá um aviso.'],
                  ].map(([q, a]) => (
                    <div key={q}>
                      <p className="font-medium text-foreground">{q}</p>
                      <p className="text-muted-foreground mt-1">{a}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="errors">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Erros Comuns
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                  <li>Email inválido (sem @)</li>
                  <li>Telefone com formatação (parênteses, traços) — use apenas números</li>
                  <li>Data em formato errado — use YYYY-MM-DD ou DD/MM/YYYY</li>
                  <li>Aspas não fechadas em observações</li>
                  <li>Arquivo corrompido — salve novamente como CSV UTF-8</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="tips">
              <AccordionTrigger>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Boas Práticas
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                  <li>Sempre valide os dados antes de importar</li>
                  <li>Use nomes de origem consistentes</li>
                  <li>Preencha a data de entrada para rastreabilidade</li>
                  <li>Adicione observações úteis para contexto</li>
                  <li>Faça backup do arquivo original antes de editar</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
