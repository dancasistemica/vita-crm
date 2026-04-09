import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ProductMetricsChartsProps {
  weeklyData: Array<{
    week: string;
    newClients: number;
    activeClients: number;
    revenue: number;
  }>;
  engagementDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

const COLORS = {
  high: '#16a34a', // green-600
  medium: '#2563eb', // blue-600
  low: '#ea580c', // orange-600
};

export function ProductMetricsCharts({
  weeklyData,
  engagementDistribution,
}: ProductMetricsChartsProps) {
  console.log('[ProductMetricsCharts] Renderizando gráficos');

  const pieData = [
    { name: 'Alto', value: engagementDistribution.high, color: COLORS.high },
    { name: 'Médio', value: engagementDistribution.medium, color: COLORS.medium },
    { name: 'Baixo', value: engagementDistribution.low, color: COLORS.low },
  ].filter((d) => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Evolução Semanal */}
      <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm">
        <h4 className="text-sm font-semibold text-neutral-900 mb-6 flex items-center gap-2">
          Evolução de Alunos (Últimas 4 Semanas)
        </h4>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="week" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line
                type="monotone"
                dataKey="activeClients"
                name="Ativos"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="newClients"
                name="Novos"
                stroke="#16a34a"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Engajamento */}
      <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm">
        <h4 className="text-sm font-semibold text-neutral-900 mb-6 flex items-center gap-2">
          Distribuição de Engajamento
        </h4>
        <div className="h-[250px] w-full flex flex-col items-center justify-center">
          {pieData.length > 0 ? (
            <div className="w-full h-full flex">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-[40%] flex flex-col justify-center gap-3">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-neutral-600 font-medium">{d.name}:</span>
                    <span className="text-xs text-neutral-900 font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-neutral-500 text-sm italic">Nenhum dado de engajamento disponível</div>
          )}
        </div>
      </div>
    </div>
  );
}
