import React from 'react';
import { TrendingUp, Calendar, Target, AlertCircle } from 'lucide-react';

interface FrequencyStatsProps {
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  recordedCount: number;
  attendanceRate: number;
  lastAttendance: string | null;
  currentStreak: number;
}

export function FrequencyStats({
  totalClasses,
  presentCount,
  absentCount,
  recordedCount,
  attendanceRate,
  lastAttendance,
  currentStreak,
}: FrequencyStatsProps) {
  console.log('[FrequencyStats] Renderizando estatísticas');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-50';
    if (rate >= 60) return 'text-blue-600 bg-blue-50';
    if (rate >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total de Aulas */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-neutral-600">Total de Aulas</p>
          <Calendar className="w-4 h-4 text-blue-600" />
        </div>
        <p className="text-3xl font-bold text-blue-600">{totalClasses}</p>
        <p className="text-xs text-neutral-500 mt-1">últimos 90 dias</p>
      </div>

      {/* Taxa de Presença */}
      <div className={`rounded-lg border border-neutral-200 p-4 shadow-sm ${getAttendanceColor(attendanceRate)}`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-neutral-600">Taxa de Presença</p>
          <TrendingUp className="w-4 h-4" />
        </div>
        <p className="text-3xl font-bold">{attendanceRate.toFixed(1)}%</p>
        <p className="text-xs text-neutral-500 mt-1">{presentCount} presenciais</p>
      </div>

      {/* Sequência Atual */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-neutral-600">Sequência Atual</p>
          <Target className="w-4 h-4 text-purple-600" />
        </div>
        <p className="text-3xl font-bold text-purple-600">{currentStreak}</p>
        <p className="text-xs text-neutral-500 mt-1">aulas consecutivas</p>
      </div>

      {/* Último Acesso */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-neutral-600">Último Acesso</p>
          <AlertCircle className="w-4 h-4 text-orange-600" />
        </div>
        <p className="text-lg font-bold text-neutral-900 truncate">
          {lastAttendance ? formatDate(lastAttendance) : 'Sem registro'}
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          {recordedCount} aulas gravadas assistidas
        </p>
      </div>
    </div>
  );
}
