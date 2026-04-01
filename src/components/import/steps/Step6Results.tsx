import { Check } from 'lucide-react';
import { ImportModalState } from '@/hooks/useImportModal';
import { Button } from "@/components/ui/ds";

interface Props {
  state: ImportModalState;
  onImportMore: () => void;
  onClose: () => void;
}

export default function Step6Results({ state, onImportMore, onClose }: Props) {
  const result = state.importResult;
  if (!result) return null;

  const errorCount = result.errors.length;
  const total = result.created + result.updated + result.converted + errorCount;

  return (
    <div className="text-center py-6 space-y-6">
      <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
        <Check className="h-8 w-8 text-success" />
      </div>

      <div>
        <p className="text-xl font-display text-foreground">Importação Concluída!</p>
        <p className="text-sm text-neutral-500 mt-1">{total} leads processados</p>
        {result.dateConversions > 0 && (
          <p className="text-xs text-blue-600 mt-1">ℹ {result.dateConversions} datas convertidas do formato Excel</p>
        )}
      </div>

      <div className="flex justify-center gap-6">
        {result.created > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-success">{result.created}</p>
            <p className="text-xs text-neutral-500">criados</p>
          </div>
        )}
        {result.updated > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{result.updated}</p>
            <p className="text-xs text-neutral-500">atualizados</p>
          </div>
        )}
        {result.converted > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-success">{result.converted}</p>
            <p className="text-xs text-neutral-500">convertidos</p>
          </div>
        )}
        {errorCount > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-destructive">{errorCount}</p>
            <p className="text-xs text-neutral-500">erros</p>
          </div>
        )}
      </div>

      {errorCount > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-left">
          <p className="text-xs font-semibold text-foreground mb-2">Erros encontrados</p>
          <div className="max-h-[160px] overflow-y-auto space-y-1">
            {result.errors.map((err, index) => (
              <p key={`${err.linha}-${index}`} className="text-[11px] text-destructive">
                Linha {err.linha}: {err.erro}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center gap-3 pt-2">
        <Button variant="secondary" onClick={onImportMore}>Importar mais</Button>
        <Button onClick={onClose}>Voltar para Leads</Button>
      </div>
    </div>
  );
}
