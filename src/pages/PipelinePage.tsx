import { Badge, Card, ScrollArea, ScrollBar, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/ds";
import { useState } from "react";
import { useLeadsData, LeadView } from "@/hooks/useLeadsData";
import AIPipelineTip from "@/components/ai/AIPipelineTip";
import LeadDetailSheet from "@/components/leads/LeadDetailSheet";
import { toast } from "sonner";
import { MoveHorizontal, ArrowRight, ArrowLeft } from "lucide-react";
import { useDataAccess } from "@/hooks/useDataAccess";

const interestColors: Record<string, string> = { frio: 'border-l-cold', morno: 'border-l-warm', quente: 'border-l-hot' };

export default function PipelinePage() {
  const { leads, pipelineStages, updateLead, loading } = useLeadsData();
  const dataAccess = useDataAccess();
  const [dragging, setDragging] = useState<string | null>(null);
  const [detailLead, setDetailLead] = useState<LeadView | null>(null);

  const sortedStages = [...pipelineStages].sort((a, b) => a.order - b.order);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDragging(leadId);
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    setDragging(null);
    if (!leadId) return;
    try {
      await updateLead(leadId, { pipelineStage: stageId });
    } catch (err) {
      toast.error('Erro ao mover lead no funil de vendas');
    }
  };

  const moveLead = async (leadId: string, stageId: string) => {
    try {
      await updateLead(leadId, { pipelineStage: stageId });
      toast.success('Lead movido com sucesso');
    } catch (err) {
      toast.error('Erro ao mover lead');
    }
  };

  const handleCreateTask = async (leadId: string, title: string) => {
    if (!dataAccess) return;
    try {
      await dataAccess.createTask({
        title,
        lead_id: leadId,
        due_date: new Date().toISOString().split('T')[0],
        type: 'outro'
      });
      toast.success('Tarefa criada com sucesso!');
    } catch (err) {
      toast.error('Erro ao criar tarefa');
    }
  };

  return (
    <div className="space-y-4 px-2 py-4 sm:p-6">
      <div className="px-1 mb-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">Funil de Vendas</h1>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {sortedStages.map((stage, index) => {
            const stageLeads = leads.filter(l => l.pipelineStage === stage.id);
            const totalDealValue = stageLeads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
            const nextStage = sortedStages[index + 1];
            const prevStage = sortedStages[index - 1];

            return (
              <div
                key={stage.id}
                className="w-72 flex-shrink-0 bg-muted/30 rounded-xl p-3 border border-border/50"
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, stage.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-neutral-800">{stage.name}</h3>
                    <Badge variant="secondary" className="bg-white/50 text-[10px] h-5 px-1.5">{stageLeads.length}</Badge>
                  </div>
                </div>
                {totalDealValue > 0 && (
                  <p className="text-[10px] font-medium text-neutral-500 mb-3 uppercase tracking-wider">
                    Total: R$ {totalDealValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                )}
                <div className="space-y-3 min-h-[200px]">
                  {stageLeads.map(lead => (
                    <Card
                      key={lead.id}
                      draggable
                      onDragStart={e => handleDragStart(e, lead.id)}
                      className={`p-3 cursor-grab active:cursor-grabbing border-l-4 ${interestColors[lead.interestLevel]} transition-all hover:shadow-lg hover:border-r hover:border-r-primary/20 ${dragging === lead.id ? 'opacity-30 scale-95' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p 
                          className="font-semibold text-sm text-foreground cursor-pointer hover:underline hover:text-primary transition-colors truncate flex-1 mr-2" 
                          onClick={() => setDetailLead(lead)}
                        >
                          {lead.name}
                        </p>
                        <AIPipelineTip lead={lead} stageName={stage.name} />
                      </div>
                      
                      <p className="text-xs text-neutral-500 mb-2">{lead.origin}</p>
                      
                      {lead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1 mb-2">
                          {lead.tags.map(tag => <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted">{tag}</Badge>)}
                        </div>
                      )}

                      {lead.dealValue != null && lead.dealValue > 0 && (
                        <p className="text-xs font-bold text-success mb-2">
                          💰 R$ {lead.dealValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}

                      <div className="pt-2 mt-2 border-t border-border/50 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] text-neutral-400">Alterar etapa:</span>
                           <div className="flex gap-1">
                              {prevStage && (
                                <button 
                                  onClick={() => moveLead(lead.id, prevStage.id)}
                                  className="p-1 hover:bg-muted rounded transition-colors"
                                  title={`Mover para ${prevStage.name}`}
                                >
                                  <ArrowLeft className="w-3.5 h-3.5 text-neutral-500" />
                                </button>
                              )}
                              {nextStage && (
                                <button 
                                  onClick={() => moveLead(lead.id, nextStage.id)}
                                  className="p-1 hover:bg-muted rounded transition-colors"
                                  title={`Mover para ${nextStage.name}`}
                                >
                                  <ArrowRight className="w-3.5 h-3.5 text-neutral-500" />
                                </button>
                              )}
                           </div>
                        </div>
                        
                        <Select value={stage.id} onValueChange={(val) => moveLead(lead.id, val)}>
                          <SelectTrigger className="h-7 text-[10px] px-2 bg-muted/50 border-none hover:bg-muted">
                            <SelectValue placeholder="Mover para..." />
                          </SelectTrigger>
                          <SelectContent>
                            {sortedStages.map(s => (
                              <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {lead.responsible && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                            {lead.responsible.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[10px] text-primary font-medium">{lead.responsible}</span>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <LeadDetailSheet
        lead={detailLead}
        open={!!detailLead}
        onClose={() => setDetailLead(null)}
        stageName={detailLead ? pipelineStages.find(s => s.id === detailLead.pipelineStage)?.name : ''}
      />
    </div>
  );
}
