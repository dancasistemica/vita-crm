import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImportModalState } from '@/hooks/useImportModal';

interface Props {
  state: ImportModalState;
  onImportMore: () => void;
  onClose: () => void;
}

export default function Step6Results({ state, onImportMore, onClose }: Props) {
  const result = state.importResult;
  if (!result) return null;

  const total = result.created + result.updated + result.duplicated;

  return (
    <div className="text-center py-6 space-y-5">
      <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
        <Check className="h-8 w-8 text-success" />
      </div>

      <div>
        <p className="text-xl font-display text-foreground">Importação Concluída!</p>
        <p className="text-sm text-muted-foreground mt-1">{total} leads processados</p>
      </div>

      <div className="flex justify-center gap-6">
        {result.created > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-success">{result.created}</p>
            <p className="text-xs text-muted-foreground">criados</p>
          </div>
        )}
        {result.updated > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{result.updated}</p>
            <p className="text-xs text-muted-foreground">atualizados</p>
          </div>
        )}
        {result.duplicated > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">{result.duplicated}</p>
            <p className="text-xs text-muted-foreground">duplicados</p>
          </div>
        )}
        {result.errors > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-destructive">{result.errors}</p>
            <p className="text-xs text-muted-foreground">erros</p>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3 pt-2">
        <Button variant="outline" onClick={onImportMore}>Importar mais</Button>
        <Button onClick={onClose}>Voltar para Leads</Button>
      </div>
    </div>
  );
}
