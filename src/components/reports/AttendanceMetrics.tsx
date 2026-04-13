import { Card, Badge, Progress } from '@/components/ui/ds';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AttendanceMetricsProps {
  metrics: {
    client_name: string;
    total_classes: number;
    present_count: number;
    recorded_count: number;
    absent_count: number;
    presence_rate: number;
    live_rate: number;
    absence_rate: number;
    risk_level: 'low' | 'medium' | 'high';
    consecutive_absences: number;
    trend: 'improving' | 'stable' | 'declining';
  };
}

export const AttendanceMetrics = ({ metrics }: AttendanceMetricsProps) => {
  return (
    <Card variant="elevated" padding="lg" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            {metrics.client_name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {metrics.trend === 'improving' && (
              <Badge variant="success" className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Melhora
              </Badge>
            )}
            {metrics.trend === 'declining' && (
              <Badge variant="danger" className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Queda
              </Badge>
            )}
            {metrics.trend === 'stable' && (
              <Badge variant="info" className="flex items-center gap-1">
                <Minus className="w-3 h-3" /> Estável
              </Badge>
            )}
          </div>
        </div>
        <Badge
          variant={
            metrics.risk_level === 'high'
              ? 'danger'
              : metrics.risk_level === 'medium'
              ? 'warning'
              : 'success'
          }
        >
          {metrics.risk_level === 'high' && '🚨 Alto Risco'}
          {metrics.risk_level === 'medium' && '⚠️ Risco Médio'}
          {metrics.risk_level === 'low' && '✅ Baixo Risco'}
        </Badge>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-primary-50 rounded-lg p-3 text-center">
          <p className="text-xs text-primary-700 opacity-75">Total</p>
          <p className="text-2xl font-bold text-primary-600">{metrics.total_classes}</p>
        </div>
        <div className="bg-success-50 rounded-lg p-3 text-center">
          <p className="text-xs text-success-700 opacity-75">Presentes</p>
          <p className="text-2xl font-bold text-success-600">{metrics.present_count}</p>
        </div>
        <div className="bg-info-50 rounded-lg p-3 text-center">
          <p className="text-xs text-info-700 opacity-75">Gravadas</p>
          <p className="text-2xl font-bold text-info-600">{metrics.recorded_count}</p>
        </div>
        <div className="bg-danger-50 rounded-lg p-3 text-center">
          <p className="text-xs text-danger-700 opacity-75">Faltas</p>
          <p className="text-2xl font-bold text-danger-600">{metrics.absent_count}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-600">Presença (Ao vivo + Gravação)</span>
            <span className="font-semibold">{metrics.presence_rate.toFixed(1)}%</span>
          </div>
          <Progress value={metrics.presence_rate} variant="primary" />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-600">Presença Ao Vivo</span>
            <span className="font-semibold">{metrics.live_rate.toFixed(1)}%</span>
          </div>
          <Progress value={metrics.live_rate} variant="success" />
        </div>
      </div>

      {metrics.consecutive_absences > 0 && (
        <div className="bg-warning-50 border border-warning-100 rounded-lg p-3">
          <p className="text-sm text-warning-800">
            <strong>⚠️ Atenção:</strong> {metrics.consecutive_absences} faltas consecutivas.
          </p>
        </div>
      )}
    </Card>
  );
};
