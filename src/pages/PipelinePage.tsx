import { useState } from "react";
import { useCRMStore } from "@/store/crmStore";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const interestColors = { frio: 'border-l-cold', morno: 'border-l-warm', quente: 'border-l-hot' } as const;

export default function PipelinePage() {
  const { leads, pipelineStages, interactions, moveLead } = useCRMStore();
  const [dragging, setDragging] = useState<string | null>(null);

  const getLastInteraction = (leadId: string) => {
    const li = interactions.filter(i => i.leadId === leadId).sort((a, b) => b.date.localeCompare(a.date));
    return li[0]?.date || '—';
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDragging(leadId);
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) moveLead(leadId, stageId);
    setDragging(null);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display text-foreground">Pipeline de Vendas</h1>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {pipelineStages.sort((a, b) => a.order - b.order).map(stage => {
            const stageLeads = leads.filter(l => l.pipelineStage === stage.id);
            return (
              <div
                key={stage.id}
                className="w-64 flex-shrink-0 bg-muted/50 rounded-xl p-3"
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, stage.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-foreground">{stage.name}</h3>
                  <Badge variant="secondary" className="text-xs">{stageLeads.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {stageLeads.map(lead => (
                    <Card
                      key={lead.id}
                      draggable
                      onDragStart={e => handleDragStart(e, lead.id)}
                      className={`p-3 cursor-grab active:cursor-grabbing border-l-4 ${interestColors[lead.interestLevel]} transition-all hover:shadow-md ${dragging === lead.id ? 'opacity-50' : ''}`}
                    >
                      <p className="font-medium text-sm text-foreground">{lead.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{lead.origin}</p>
                      {lead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {lead.tags.map(tag => <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>)}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">Última: {getLastInteraction(lead.id)}</span>
                        {lead.responsible && <span className="text-xs text-primary">{lead.responsible}</span>}
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
    </div>
  );
}
