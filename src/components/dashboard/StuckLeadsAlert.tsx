import { AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/ds';
import { } from '@/components/ui/ds';
import type { StuckLead } from '@/hooks/useDashboardData';

interface StuckLeadsAlertProps {
  stuckLeads: StuckLead[];
  onLeadClick: (leadId: string) => void;
}

export default function StuckLeadsAlert({ stuckLeads, onLeadClick }: StuckLeadsAlertProps) {
  if (stuckLeads.length === 0) return null;

  return (
    <Card className="border-destructive/40 shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-display flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          {stuckLeads.length} Lead(s) Travado(s)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-48 overflow-y-auto">
          {stuckLeads.slice(0, 5).map((lead) => (
            <div
              key={lead.id}
              onClick={() => onLeadClick(lead.id)}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer transition"
            >
              <div>
                <p className="font-semibold text-foreground text-sm">{lead.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {lead.daysInStage} dias em "{lead.stage}"
                </div>
              </div>
              < size="sm" variant="error" className="text-xs h-7">
                Ver
              </>
            </div>
          ))}
        </div>
        {stuckLeads.length > 5 && (
          <p className="text-xs text-muted-foreground mt-2">
            +{stuckLeads.length - 5} lead(s) adicional(is)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
