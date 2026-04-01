import type { StageMetric } from '@/hooks/useDashboardData';
import { Card, CardContent } from "@/components/ui/ds";

interface StageMetricsProps {
  metrics: StageMetric[];
}

const BORDER_COLORS = [
  'border-l-primary',
  'border-l-accent',
  'border-l-info',
  'border-l-success',
];

export default function StageMetrics({ metrics }: StageMetricsProps) {
  if (metrics.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, i) => (
        <Card key={i} className={`shadow-card border-l-4 ${BORDER_COLORS[i % BORDER_COLORS.length]} border-border/60`}>
          <CardContent className="pt-4 pb-3">
            <h3 className="text-lg font-semibold text-neutral-700">{metric.name}</h3>
            <div className="space-y-1.5">
              <div>
                <span className="text-2xl font-bold text-foreground">{metric.leadCount}</span>
                <span className="text-xs text-muted-foreground ml-1">leads</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-success font-semibold">{metric.conversionRate.toFixed(0)}%</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-accent font-semibold">{metric.avgDaysInStage}d</span>
                <span className="text-xs text-muted-foreground">
                  {metric.avgDaysInStage === 0 ? 'hoje' : 'média'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
