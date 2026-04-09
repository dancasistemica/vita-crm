import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/ds";
import { ProductOverview } from "@/services/executiveDashboardService";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell
} from 'recharts';

interface ProductComparisonChartProps {
  products: ProductOverview[];
}

export function ProductComparisonChart({ products }: ProductComparisonChartProps) {
  const data = products.map(p => ({
    name: p.productName,
    "Clientes Totais": p.totalClients,
    "Ativos": p.activeClients,
    "Em Risco": p.churnRiskCount,
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Comparativo entre Produtos</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend />
            <Bar dataKey="Clientes Totais" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Ativos" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Em Risco" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
