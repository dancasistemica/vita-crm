import { useEffect } from 'react';
import { useAI } from '@/hooks/useAI';
import { Card, CardContent, CardHeader, CardTitle, Button, Skeleton } from '@/components/ui/ds';
import { RefreshCw, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Lead } from '@/types/crm';

interface Props {
  lead: Lead;
  products: { name: string }[];
  stageName: string;
}

export default function AILeadInsight({ lead, products, stageName }: Props) {
  const { response, loading, generate, regenerate } = useAI({
    type: 'lead_insight',
    cacheKey: `lead_insight_${lead.id}`,
    cacheDurationHours: 24,
  });

  useEffect(() => {
    const prompt = `Analise esta lead:
- Nome: ${lead.name}
- Origem: ${lead.origin}
- Nível de interesse: ${lead.interestLevel}
- Dor principal: ${lead.customData?.pain_point || 'Não informada'}
- Objetivo emocional: ${lead.customData?.emotional_goal || 'Não informado'}
- Área de tensão corporal: ${lead.customData?.body_tension_area || 'Não informada'}
- Interesse principal: ${lead.mainInterest || 'Não informado'}
- Etapa do funil: ${stageName}
- Produtos disponíveis: ${products.map(p => p.name).join(', ') || 'Nenhum'}`;

    generate(prompt);
  }, [lead.id]);

  return (
    <Card className="border-purple-200 dark:border-purple-800/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span>Insight IA</span>
          <span className="inline-flex items-center text-[10px] font-medium text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded-full">✨ IA</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : response ? (
          <div className="space-y-3">
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
              <ReactMarkdown>{response}</ReactMarkdown>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-muted-foreground">Sugestão gerada por IA — revise antes de agir</span>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={regenerate} disabled={loading}>
                <RefreshCw className="h-3 w-3 mr-1" /> Atualizar
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum insight disponível.</p>
        )}
      </CardContent>
    </Card>
  );
}
