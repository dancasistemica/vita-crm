import { Card } from "@/components/ui/ds";
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import type { DashboardMetrics } from "@/services/dashboardService";

interface AlertsSummaryProps {
  metrics: DashboardMetrics;
}

export default function AlertsSummary({ metrics }: AlertsSummaryProps) {
  const alertStats = [
    { label: "Críticos", count: metrics.alerts.high_severity_alerts, color: "text-destructive", icon: AlertCircle, bg: "bg-destructive/10" },
    { label: "Médios", count: metrics.alerts.medium_severity_alerts, color: "text-warning", icon: AlertTriangle, bg: "bg-warning/10" },
    { label: "Baixos", count: metrics.alerts.low_severity_alerts, color: "text-info", icon: Info, bg: "bg-info/10" },
  ];

  return (
    <Card className="shadow-card border-border/60 p-6 h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-neutral-900">Resumo de Alertas</h3>
          <p className="text-xs text-neutral-500">Situação atual da operação</p>
        </div>
        <div className="px-3 py-1 bg-neutral-100 rounded-full">
          <p className="text-xs font-bold text-neutral-600">Total: {metrics.alerts.total_active_alerts}</p>
        </div>
      </div>

      <div className="space-y-4">
        {alertStats.map((stat, i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/50">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="font-semibold text-neutral-800">{stat.label}</p>
            </div>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.count}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-3 p-4 bg-success/5 border border-success/10 rounded-xl">
        <CheckCircle2 className="h-5 w-5 text-success" />
        <div className="flex-1">
          <p className="text-sm font-bold text-neutral-900">{metrics.alerts.alerts_resolved_today} Alertas Resolvidos</p>
          <p className="text-xs text-neutral-600">Resolvidos nas últimas 24 horas</p>
        </div>
      </div>
    </Card>
  );
}
