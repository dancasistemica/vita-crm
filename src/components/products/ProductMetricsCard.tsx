import React from 'react';
import { TrendingUp, Users, Activity, AlertCircle, PieChart, BarChart } from 'lucide-react';

interface ProductMetricsCardProps {
  productName: string;
  totalClients: number;
  activeClients: number;
  activePercentage: number;
  attendanceRate: number;
  churnRisk: number;
  averageEngagementLevel: string;
}

export function ProductMetricsCard({
  productName,
  totalClients,
  activeClients,
  activePercentage,
  attendanceRate,
  churnRisk,
  averageEngagementLevel,
}: ProductMetricsCardProps) {
  console.log('[ProductMetricsCard] Renderizando métricas:', productName);

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'ALTO':
        return 'text-green-600';
      case 'MÉDIO':
        return 'text-blue-600';
      case 'BAIXO':
        return 'text-orange-600';
      default:
        return 'text-neutral-600';
    }
  };

  const getChurnColor = (risk: number) => {
    if (risk > 30) return 'text-red-600 bg-red-50';
    if (risk > 15) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getAttendanceColor = (rate: number) => {
    if (rate > 70) return 'text-green-600';
    if (rate > 40) return 'text-blue-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-6 shadow-sm">
      {/* Título */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">{productName}</h3>
          <p className="text-sm text-neutral-600 mt-1">Métricas da semana</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getChurnColor(churnRisk)}`}>
          {churnRisk > 15 ? 'Risco de Churn' : 'Saudável'}
        </div>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Total de Clientes */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between mb-2 text-blue-600">
            <p className="text-sm font-medium">Total</p>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-neutral-900">{totalClients}</p>
        </div>

        {/* Clientes Ativos */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-center justify-between mb-2 text-green-600">
            <p className="text-sm font-medium">Ativos</p>
            <Activity className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-neutral-900">{activeClients}</p>
          <p className="text-xs text-green-600 mt-1">{activePercentage}% do total</p>
        </div>

        {/* Taxa de Presença */}
        <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
          <div className="flex items-center justify-between mb-2 text-neutral-600">
            <p className="text-sm font-medium">Presença</p>
            <BarChart className="w-4 h-4" />
          </div>
          <p className={`text-2xl font-bold ${getAttendanceColor(attendanceRate)}`}>
            {attendanceRate}%
          </p>
          <p className="text-xs text-neutral-500 mt-1">Últimos 30 dias</p>
        </div>
      </div>

      {/* Outras Métricas */}
      <div className="grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4">
        <div className="flex items-center gap-3">
          <PieChart className="w-4 h-4 text-neutral-400" />
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Engajamento Médio</p>
            <p className={`text-sm font-bold ${getEngagementColor(averageEngagementLevel)}`}>
              {averageEngagementLevel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-neutral-400" />
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Risco de Churn</p>
            <p className={`text-sm font-bold ${churnRisk > 15 ? 'text-red-600' : 'text-green-600'}`}>
              {churnRisk}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
