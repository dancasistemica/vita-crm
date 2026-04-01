import { Button, Card, Skeleton } from "@/components/ui/ds";
import { useState } from 'react';
import { useAI } from '@/hooks/useAI';
import { useCRMStore } from '@/store/crmStore';
import { Sparkles, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AIWeeklySummary() {
  const { leads, tasks, sales, pipelineStages } = useCRMStore();
  const [hasLoaded, setHasLoaded] = useState(false);
  const { response, loading, generate, regenerate } = useAI({
    type: 'weekly_summary',
    cacheKey: `weekly_summary_${new Date().toISOString().split('T')[0]}`,
    cacheDurationHours: 24,
  });

  const handleLoad = async () => {
    const today = new Date().toISOString().split('T')[0];
    const overdueTasks = tasks.filter(t => !t.completed && t.dueDate < today);
    const hotLeads = leads.filter(l => l.interestLevel === 'quente');
    const recentLeads = leads.filter(l => {
      const entryDate = new Date(l.entryDate);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return entryDate >= weekAgo;
    });

    const getStageName = (id: string) => pipelineStages.find(s => s.id === id)?.name || id;

    const prompt = `Dados desta semana do CRM:

LEADS QUENTES (${hotLeads.length}):
${hotLeads.slice(0, 10).map(l => `- ${l.name} | Etapa: ${getStageName(l.pipelineStage)} | Interesse: ${l.mainInterest || 'não informado'}`).join('\n') || 'Nenhum'}

NOVOS LEADS (${recentLeads.length}):
${recentLeads.slice(0, 5).map(l => `- ${l.name} | Origem: ${l.origin}`).join('\n') || 'Nenhum'}

TAREFAS ATRASADAS (${overdueTasks.length}):
${overdueTasks.slice(0, 10).map(t => `- ${t.title} | Vencimento: ${t.dueDate}`).join('\n') || 'Nenhuma'}

TOTAL LEADS: ${leads.length}
VENDAS RECENTES: ${sales.length}

Gere o resumo semanal.`;

    await generate(prompt);
    setHasLoaded(true);
  };

  return (
    <Card className="border-purple-200 dark:border-purple-800/50 shadow-card">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold mb-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Resumo da Semana IA
            <span className="inline-flex items-center text-[10px] font-medium text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded-full">✨ IA</span>
          </h2>
          {hasLoaded && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={regenerate} disabled={loading}>
              <RefreshCw className="h-3 w-3 mr-1" /> Atualizar
            </Button>
          )}
        </div>
      </div>
      <div>
        {!hasLoaded && !loading ? (
          <div className="text-center py-4">
            <p className="text-sm text-neutral-500 mb-3">Clique para gerar o resumo inteligente da semana</p>
            <Button onClick={handleLoad} variant="secondary" size="sm">
              <Sparkles className="h-4 w-4 mr-1.5 text-purple-500" /> Gerar Resumo
            </Button>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : response ? (
          <div className="space-y-3">
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
              <ReactMarkdown>{response}</ReactMarkdown>
            </div>
            <p className="text-[10px] text-neutral-500 pt-1">Sugestão gerada por IA — revise antes de agir</p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
