import { Card } from "@/components/ui/ds";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";
import type { DashboardMetrics } from "@/services/dashboardService";

interface IntegrationStatusProps {
  metrics: DashboardMetrics;
}

export default function IntegrationStatus({ metrics }: IntegrationStatusProps) {
  return (
    <Card className="shadow-card border-border/60 p-6 h-full bg-gradient-to-br from-white to-neutral-50/50">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-neutral-900">Status de Integrações</h3>
          <p className="text-xs text-neutral-500">Conectividade com plataformas</p>
        </div>
        <div className="p-2 bg-info/10 rounded-lg">
          <RefreshCw className="h-5 w-5 text-info animate-spin-slow" />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-6">
          <div className="text-center p-6 bg-white shadow-sm border border-border/40 rounded-2xl flex-1">
            <CheckCircle className="h-6 w-6 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-neutral-900">{metrics.integrations.connected_integrations}</p>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Ativas</p>
          </div>
          <div className="text-center p-6 bg-white shadow-sm border border-border/40 rounded-2xl flex-1">
            <XCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
            <p className="text-2xl font-bold text-neutral-900">{metrics.integrations.disconnected_integrations}</p>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Inativas</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/50 border border-border/40 rounded-xl">
            <p className="text-xs font-bold text-neutral-600 uppercase">Última Sincronização</p>
            <p className="text-sm font-semibold text-neutral-900">{metrics.integrations.last_sync_time}</p>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/50 border border-border/40 rounded-xl">
            <p className="text-xs font-bold text-neutral-600 uppercase">Status Global</p>
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
              metrics.integrations.sync_status === 'success' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
            }`}>
              {metrics.integrations.sync_status === 'success' ? 'Operacional' : 'Requer Atenção'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
