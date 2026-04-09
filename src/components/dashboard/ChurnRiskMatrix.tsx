import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/ds";
import { ProductOverview } from "@/services/executiveDashboardService";
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LabelList
} from 'recharts';

interface ChurnRiskMatrixProps {
  products: ProductOverview[];
}

export function ChurnRiskMatrix({ products }: ChurnRiskMatrixProps) {
  // Matriz simplificada: Eixo X = Engajamento, Eixo Y = Risco Churn
  // Engajamento mapeado para números: BAIXO=1, MÉDIO=2, ALTO=3
  const data = products.map(p => ({
    name: p.productName,
    engagement: p.averageEngagementLevel === 'ALTO' ? 3 : p.averageEngagementLevel === 'MÉDIO' ? 2 : 1,
    engagementLabel: p.averageEngagementLevel,
    churnRisk: p.churnRiskPercentage,
    size: p.totalClients
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border p-2 rounded-lg shadow-lg text-xs">
          <p className="font-bold">{data.name}</p>
          <p>Engajamento: {data.engagementLabel}</p>
          <p>Risco Churn: {data.churnRisk}%</p>
          <p>Clientes: {data.size}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Matriz de Risco vs Engajamento</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              type="number" 
              dataKey="engagement" 
              name="Engajamento" 
              domain={[0, 4]}
              ticks={[1, 2, 3]}
              tickFormatter={(val) => val === 1 ? 'BAIXO' : val === 2 ? 'MÉDIO' : val === 3 ? 'ALTO' : ''}
              label={{ value: 'Nível de Engajamento', position: 'bottom', offset: 0 }}
            />
            <YAxis 
              type="number" 
              dataKey="churnRisk" 
              name="Risco Churn" 
              unit="%" 
              label={{ value: 'Risco de Churn (%)', angle: -90, position: 'insideLeft' }}
            />
            <ZAxis type="number" dataKey="size" range={[100, 1000]} name="Total Clientes" />
            <Tooltip content={<CustomTooltip />} />
            <Scatter name="Produtos" data={data} fill="#3b82f6">
               <LabelList dataKey="name" position="top" style={{ fontSize: '10px' }} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
