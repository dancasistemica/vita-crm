import { useState } from "react";
import { useLeadsData, LeadView } from "@/hooks/useLeadsData";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import AIPipelineTip from "@/components/ai/AIPipelineTip";
import LeadDetailSheet from "@/components/leads/LeadDetailSheet";
import { toast } from "sonner";

const interestColors: Record<string, string> = { frio: 'border-l-cold', morno: 'border-l-warm', quente: 'border-l-hot' };

export default function PipelinePage() {
  const { leads, pipelineStages, updateLead, loading } = useLeadsData();
  const [dragging, setDragging] = useState<string | null>(null);
  const [detailLead, setDetailLead] = useState<LeadView | null>(null);

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

  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold text-neutral-900 mb-6">Funil de Vendas</h1>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {pipelineStages.sort((a, b) => a.order - b.order).map(stage => {
            const stageLeads = leads.filter(l => l.pipelineStage === stage.id);
            const totalDealValue = stageLeads.reduce((sum, l) => sum + (l.dealValue || 0), 0);
            return (
              <div
                key={stage.id}
                className="w-64 flex-shrink-0 bg-muted/50 rounded-xl p-3"
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, stage.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold text-neutral-700">{stage.name}</h3>
                  <Badge variant="secondary" className="text-xs">{stageLeads.length}</Badge>
                </div>
                {totalDealValue > 0 && (
                  <p className="text-xs text-muted-foreground mb-3">R$ {totalDealValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em negócios</p>
                )}
                <div className="space-y-2 min-h-[100px]">
                  {stageLeads.map(lead => (
                    <Card
                      key={lead.id}
                      draggable
                      onDragStart={e => handleDragStart(e, lead.id)}
                      className={`p-3 cursor-grab active:cursor-grabbing border-l-4 ${interestColors[lead.interestLevel]} transition-all hover:shadow-md ${dragging === lead.id ? 'opacity-50' : ''}`}
                    >
                      <p className="font-medium text-sm text-foreground cursor-pointer hover:underline hover:text-primary" onClick={() => setDetailLead(lead)}>{lead.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{lead.origin}</p>
                      {lead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {lead.tags.map(tag => <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>)}
                        </div>
                      )}
                      {lead.dealValue != null && lead.dealValue > 0 && (
                        <p className="text-xs font-medium text-success mt-1">💰 R$ {lead.dealValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">Última: —</span>
                        <div className="flex items-center gap-1">
                          <AIPipelineTip lead={lead} stageName={stage.name} />
                          {lead.responsible && <span className="text-xs text-primary">{lead.responsible}</span>}
                        </div>
                      </div>
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
