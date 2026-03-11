import { Download, FileSpreadsheet, Upload, CheckCircle, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const timeline = [
  { icon: Download, label: 'Baixe o modelo', desc: 'CSV ou XLSX' },
  { icon: FileSpreadsheet, label: 'Preencha seus dados', desc: 'Em Excel ou Google Sheets' },
  { icon: Upload, label: 'Faça upload', desc: 'Selecione o arquivo preenchido' },
  { icon: CheckCircle, label: 'Validamos', desc: 'Detectamos duplicatas e erros' },
  { icon: Database, label: 'Importamos', desc: 'Dados adicionados ao CRM' },
];

export default function Step2Explanation({ onNext, onBack }: Props) {
  return (
    <div className="space-y-6 py-2">
      <h3 className="text-lg font-display text-foreground text-center">Como funciona</h3>

      <div className="space-y-3">
        {timeline.map(({ icon: Icon, label, desc }, i) => (
          <div key={label} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{i + 1}</div>
              {i < timeline.length - 1 && <div className="w-0.5 h-4 bg-border" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-primary" /> {label}
              </p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
        <p className="text-xs font-semibold text-foreground">📌 Informações importantes</p>
        <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
          <li>Campos obrigatórios: <strong>Nome</strong> + (<strong>Email</strong> ou <strong>Telefone</strong>)</li>
          <li>Duplicatas detectadas por email ou telefone</li>
          <li>Opções faltantes criadas automaticamente</li>
          <li>Máximo de 1.000 leads por importação</li>
          <li>Use XLSX para evitar problemas de separadores</li>
        </ul>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Voltar</Button>
        <Button onClick={onNext}>Próximo</Button>
      </div>
    </div>
  );
}
