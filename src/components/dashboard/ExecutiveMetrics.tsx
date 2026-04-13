import { Card } from "@/components/ui/ds";
import { DollarSign, Users, Bell, Globe, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { DashboardMetrics } from "@/services/dashboardService";

interface ExecutiveMetricsProps {
  metrics: DashboardMetrics;
}

export default function ExecutiveMetrics({ metrics }: ExecutiveMetricsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-neutral-400" />;
    }
  };

  const mainMetrics = [
    {
      label: "Faturamento Total",
      value: formatCurrency(metrics.sales.total_revenue),
      icon: DollarSign,
      trend: metrics.sales.sales_trend,
      trendValue: `${metrics.sales.sales_trend_percentage.toFixed(1)}%`,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Taxa de Presença",
      value: `${metrics.attendance.average_attendance_rate.toFixed(1)}%`,
      icon: Users,
      trend: metrics.attendance.attendance_trend,
      trendValue: `${metrics.attendance.attendance_trend_percentage.toFixed(1)}%`,
      color: "bg-success/10 text-success",
    },
    {
      label: "Alertas Ativos",
      value: metrics.alerts.total_active_alerts,
      icon: Bell,
      subtitle: `${metrics.alerts.high_severity_alerts} críticos`,
      color: "bg-destructive/10 text-destructive",
    },
    {
      label: "Integrações",
      value: `${metrics.integrations.connected_integrations}/${metrics.integrations.total_integrations}`,
      icon: Globe,
      subtitle: `Última sinc: ${metrics.integrations.last_sync_time}`,
      color: "bg-info/10 text-info",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {mainMetrics.map((m, i) => (
        <Card key={i} className="shadow-card border-border/60 hover-lift">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${m.color}`}>
              <m.icon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{m.label}</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-neutral-900">{m.value}</p>
                {m.trend && (
                  <div className="flex items-center gap-1">
                    {getTrendIcon(m.trend)}
                    <span className={`text-xs font-semibold ${m.trend === 'up' ? 'text-success' : m.trend === 'down' ? 'text-destructive' : 'text-neutral-400'}`}>
                      {m.trendValue}
                    </span>
                  </div>
                )}
              </div>
              {(m.subtitle) && (
                <p className="text-xs text-neutral-500 mt-1">{m.subtitle}</p>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
