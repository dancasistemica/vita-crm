import { useState } from 'react';
import { useAI } from '@/hooks/useAI';
import { Button } from '@/components/ui/ds';
import { Textarea } from '@/components/ui/ds';
import { Sparkles, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { Lead, Interaction } from '@/types/crm';

interface Props {
  lead: Lead;
  interactions: Interaction[];
  products: { name: string }[];
  stageName: string;
}

export default function AIResponseSuggestion({ lead, interactions, products, stageName }: Props) {
  const [suggestion, setSuggestion] = useState('');
  const { loading, generate, regenerate } = useAI({ type: 'suggest_response' });

  const handleGenerate = async () => {
    const lastInteraction = interactions.sort((a, b) => b.date.localeCompare(a.date))[0];
    const prompt = `Contexto da lead:
- Nome: ${lead.name}
- Origem: ${lead.origin}
- Nível de interesse: ${lead.interestLevel}
- Dor principal: ${lead.customData?.pain_point || 'Não informada'}
- Objetivo emocional: ${lead.customData?.emotional_goal || 'Não informado'}
- Área de tensão corporal: ${lead.customData?.body_tension_area || 'Não informada'}
- Interesse principal: ${lead.mainInterest || 'Não informado'}
- Etapa do funil: ${stageName}
- Última interação: ${lastInteraction ? `${lastInteraction.type} - ${lastInteraction.note}` : 'Nenhuma'}
- Produtos disponíveis: ${products.map(p => p.name).join(', ') || 'Nenhum'}

Gere uma sugestão de mensagem acolhedora para enviar a esta lead.`;

    const result = await generate(prompt);
    if (result) setSuggestion(result);
  };

  const handleRegenerate = async () => {
    const result = await regenerate();
    if (result) setSuggestion(result);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestion);
    toast.success('Mensagem copiada!');
  };

  return (
    <div className="space-y-3">
      <Button variant="neutral" size="sm" onClick={handleGenerate} disabled={loading}>
        <Sparkles className="h-4 w-4 mr-1.5 text-purple-500" />
        {loading ? 'Gerando...' : '✨ Sugerir resposta'}
      </Button>

      {suggestion && (
        <div className="space-y-3 animate-in fade-in-50">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded-full">
              ✨ IA
            </span>
            <span className="text-xs text-muted-foreground">Sugestão gerada por IA — revise antes de enviar</span>
          </div>
          <Textarea value={suggestion} onChange={e => setSuggestion(e.target.value)} rows={5} className="text-sm" />
          <div className="flex gap-3">
            <Button size="sm" variant="neutral" onClick={handleCopy}><Copy className="h-3.5 w-3.5 mr-1" /> Copiar</Button>
            <Button size="sm" variant="neutral" onClick={handleRegenerate} disabled={loading}><RefreshCw className="h-3.5 w-3.5 mr-1" /> Regenerar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
