import { Card } from "@/components/ui/ds";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { DashboardMetrics } from "@/services/dashboardService";

interface SalesMetricsProps {
  metrics: DashboardMetrics;
}

export default function SalesMetrics({ metrics }: SalesMetricsProps) {
  const chartData = [
    { name: "Concluídas", value: metrics.sales.completed_sales, color: "hsl(var(--success))" },
    { name: "Pendentes", value: metrics.sales.pending_sales, color: "hsl(var(--warning))" },
    { name: "Atrasadas", value: metrics.sales.overdue_sales, color: "hsl(var(--destructive))" },
  ];

  return (
    <Card className="shadow-card border-border/60">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-lg font-bold text-neutral-900">Vendas por Status</h3>
          <p className="text-xs text-neutral-500">Distribuição das vendas no período</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-neutral-900">Ticket Médio</p>
          <p className="text-2xl font-bold text-primary">
            R$ {metrics.sales.average_ticket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Conversão</p>
          <p className="text-xl font-bold text-neutral-900">{metrics.sales.conversion_rate.toFixed(1)}%</p>
        </div>
        <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-100">
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Total Vendas</p>
          <p className="text-xl font-bold text-neutral-900">{metrics.sales.total_sales}</p>
        </div>
      </div>
    </Card>
  );
}
