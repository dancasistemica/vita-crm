import { useState } from 'react';
import { useAI } from '@/hooks/useAI';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Plus } from 'lucide-react';
import type { Lead } from '@/types/crm';

interface Props {
  lead: Lead;
  stageName: string;
  daysInStage?: number;
  onCreateTask?: (title: string) => void;
}

export default function AIPipelineTip({ lead, stageName, daysInStage, onCreateTask }: Props) {
  const [open, setOpen] = useState(false);
  const { response, loading, generate, regenerate } = useAI({ type: 'pipeline_tip' });

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !response) {
      const prompt = `Lead "${lead.name}" está na etapa "${stageName}" há ${daysInStage || '?'} dias.
Interesse: ${lead.interestLevel}. Dor: ${lead.customData?.pain_point || 'não informada'}. Objetivo: ${lead.customData?.emotional_goal || 'não informado'}.
Sugira uma ação prática para avançar esta lead no funil.`;
      await generate(prompt);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button className="p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors" title="Sugestão IA">
          <Sparkles className="h-3.5 w-3.5 text-purple-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded-full">✨ IA</span>
            <span className="text-xs font-medium text-foreground">Próximo passo sugerido</span>
          </div>
          {loading ? (
            <div className="flex items-center gap-3 py-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500" />
              <span className="text-xs text-muted-foreground">Analisando...</span>
            </div>
          ) : response ? (
            <>
              <p className="text-sm text-foreground leading-relaxed">{response}</p>
              <div className="flex gap-1.5 pt-1">
                {onCreateTask && (
                  <Button size="sm" variant="neutral" className="h-7 text-xs" onClick={() => onCreateTask(response)}>
                    <Plus className="h-3 w-3 mr-1" /> Criar tarefa
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={regenerate} disabled={loading}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Nova sugestão
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Sugestão gerada por IA</p>
            </>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
