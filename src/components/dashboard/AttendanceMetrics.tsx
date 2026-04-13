import { Card } from "@/components/ui/ds";
import { Users, GraduationCap, TrendingUp } from "lucide-react";
import type { DashboardMetrics } from "@/services/dashboardService";

interface AttendanceMetricsProps {
  metrics: DashboardMetrics;
}

export default function AttendanceMetrics({ metrics }: AttendanceMetricsProps) {
  return (
    <Card className="shadow-card border-border/60 p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-neutral-900">Engajamento de Alunos</h3>
            <p className="text-xs text-neutral-500">Métricas de presença e retenção</p>
          </div>
          <div className="p-2 bg-success/10 rounded-lg">
            <Users className="h-5 w-5 text-success" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-neutral-600 uppercase">Total Alunos</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{metrics.attendance.total_students}</p>
          </div>

          <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-info" />
              <span className="text-xs font-semibold text-neutral-600 uppercase">Total Aulas</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{metrics.attendance.total_classes}</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-700">Taxa Média de Presença</span>
          <span className="text-sm font-bold text-neutral-900">{metrics.attendance.average_attendance_rate.toFixed(1)}%</span>
        </div>
        <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-success transition-all duration-500 ease-out" 
            style={{ width: `${metrics.attendance.average_attendance_rate}%` }} 
          />
        </div>
        <p className="text-[10px] text-neutral-400 mt-2 text-center italic">
          Comparado a {metrics.attendance.attendance_trend_percentage.toFixed(1)}% no período anterior
        </p>
      </div>
    </Card>
  );
}
