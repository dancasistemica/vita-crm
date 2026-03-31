import { Button, Clock, RefreshCw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/ds';
import { Button, Card, CardContent } from '@/components/ui/ds';

interface Props {
  onNext: () => void;
  onClose: () => void;
}

const cards = [
  { Button, icon: Clock, title: 'Economize tempo', desc: 'Importe múltiplos leads de uma vez a partir de planilhas' },
  { Button, icon: RefreshCw, title: 'Atualize dados', desc: 'Detectamos duplicatas e você decide o que fazer' },
  { Button, icon: Shield, title: 'Seguro', desc: 'Validação automática antes de importar' },
];

export default function Step1Intent({ Button, onNext, onClose }: Props) {
  return (
    <div className="space-y-6 text-center py-4">
      <div>
        <div className="text-5xl mb-3">📥</div>
        <h2 className="text-2xl font-semibold text-neutral-900">Importar Leads</h2>
        <p className="text-sm text-muted-foreground mt-1">Adicione novos leads em massa ao seu CRM</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map(({ Button, icon: Icon, title, desc }) => (
          <Card key={title} className="border-border/50">
            <CardContent className="pt-5 pb-4 px-4 text-center space-y-3">
              <Icon className="h-7 w-7 text-primary mx-auto" />
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center gap-3 pt-2">
        <Button variant="neutral" onClick={onClose}>Cancelar</Button>
        <Button onClick={onNext}>Começar Importação</Button>
      </div>
    </div>
  );
}
