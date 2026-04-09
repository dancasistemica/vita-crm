import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";

interface KeyMetricsCardsProps {
  data: {
    totalClients: number;
    totalActiveClients: number;
    totalRevenue: number;
    totalMRR: number;
    overallRetentionRate: number;
    overallChurnRisk: number;
  };
}

export function KeyMetricsCards({ data }: KeyMetricsCardsProps) {
  const metrics = [
    {
      title: "Clientes Totais",
      value: data.totalClients,
      icon: Users,
      description: `${data.totalActiveClients} ativos`,
      color: "text-blue-600",
    },
    {
      title: "Receita Total",
      value: `R$ ${data.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: `MRR: R$ ${data.totalMRR.toLocaleString()}`,
      color: "text-green-600",
    },
    {
      title: "Taxa de Retenção",
      value: `${data.overallRetentionRate}%`,
      icon: CheckCircle,
      description: "Média de todos os produtos",
      color: "text-emerald-600",
    },
    {
      title: "Risco de Churn",
      value: `${data.overallChurnRisk}%`,
      icon: AlertTriangle,
      description: "Clientes em risco (7 dias sem acesso)",
      color: "text-amber-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground">{metric.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
