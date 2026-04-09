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
                className="w-64 flex-shrink-0 bg-muted/30 rounded-xl p-2 border border-border/50"
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, stage.id)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-neutral-800">{stage.name}</h3>
                    <Badge variant="secondary" className="bg-white/50 text-[9px] h-4 px-1">{stageLeads.length}</Badge>
                  </div>
                </div>
                {totalDealValue > 0 && (
                  <p className="text-[9px] font-medium text-neutral-500 mb-2 uppercase tracking-wider">
                    Total: R$ {totalDealValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                )}
                <div className="space-y-2 min-h-[200px]">
                  {stageLeads.map(lead => (
                    <Card
                      key={lead.id}
                      draggable
                      onDragStart={e => handleDragStart(e, lead.id)}
                      className={`p-2.5 cursor-grab active:cursor-grabbing border-l-4 ${interestColors[lead.interestLevel]} transition-all hover:shadow-lg hover:border-r hover:border-r-primary/20 ${dragging === lead.id ? 'opacity-30 scale-95' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-0.5">
                        <p 
                          className="font-semibold text-[13px] text-foreground cursor-pointer hover:underline hover:text-primary transition-colors truncate flex-1 mr-2" 
                          onClick={() => setDetailLead(lead)}
                        >
                          {lead.name}
                        </p>
                        <AIPipelineTip 
                          lead={lead} 
                          stageName={stage.name} 
                          onCreateTask={(title) => handleCreateTask(lead.id, title)}
                        />
                      </div>
                      
                      <p className="text-[10px] text-neutral-500 mb-1.5">{lead.origin}</p>
                      
                      {lead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5 mb-1.5">
                          {lead.tags.map(tag => <Badge key={tag} variant="secondary" className="text-[9px] px-1 py-0 bg-muted">{tag}</Badge>)}
                        </div>
                      )}

                      {lead.dealValue != null && lead.dealValue > 0 && (
                        <p className="text-[11px] font-bold text-success mb-1.5">
                          💰 R$ {lead.dealValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}

                      <div className="pt-2 mt-2 border-t border-border/50 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                           <span className="text-[11px] font-medium text-neutral-500">Etapa:</span>
                           <div className="flex gap-1.5">
                              {prevStage && (
                                <button 
                                  onClick={() => moveLead(lead.id, prevStage.id)}
                                  className="p-1 hover:bg-muted rounded transition-colors"
                                  title={`Mover para ${prevStage.name}`}
                                >
                                  <ArrowLeft className="w-4 h-4 text-neutral-500" />
                                </button>
                              )}
                              {nextStage && (
                                <button 
                                  onClick={() => moveLead(lead.id, nextStage.id)}
                                  className="p-1 hover:bg-muted rounded transition-colors"
                                  title={`Mover para ${nextStage.name}`}
                                >
                                  <ArrowRight className="w-4 h-4 text-neutral-500" />
                                </button>
                              )}
                           </div>
                        </div>
                        
                        <Select value={stage.id} onValueChange={(val) => moveLead(lead.id, val)}>
                          <SelectTrigger className="h-8 text-[11px] px-2.5 bg-muted/50 border-none hover:bg-muted">
                            <SelectValue placeholder="Mover..." />
                          </SelectTrigger>
                          <SelectContent>
                            {sortedStages.map(s => (
                              <SelectItem key={s.id} value={s.id} className="text-[11px]">{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {lead.responsible && (
                        <div className="mt-1.5 flex items-center gap-1">
                          <div className="w-3.5 h-3.5 rounded-full bg-primary/20 flex items-center justify-center text-[7px] font-bold text-primary">
                            {lead.responsible.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[9px] text-primary font-medium">{lead.responsible}</span>
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
