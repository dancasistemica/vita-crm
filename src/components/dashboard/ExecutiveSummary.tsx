import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui/ds";
import { ProductOverview } from "@/services/executiveDashboardService";
import { Trophy, TrendingDown, AlertCircle } from "lucide-react";

interface ExecutiveSummaryProps {
  topProduct: ProductOverview | null;
  lowestProduct: ProductOverview | null;
  highestRiskProduct: ProductOverview | null;
}

export function ExecutiveSummary({ 
  topProduct, 
  lowestProduct, 
  highestRiskProduct 
}: ExecutiveSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-emerald-500" />
            Melhor Desempenho
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">{topProduct?.productName || 'N/A'}</div>
          <div className="text-xs text-muted-foreground flex justify-between mt-1">
            <span>Retenção:</span>
            <span className="font-medium text-emerald-600">{topProduct?.activePercentage || 0}%</span>
          </div>
          <div className="text-xs text-muted-foreground flex justify-between">
            <span>Ativos:</span>
            <span className="font-medium">{topProduct?.activeClients || 0}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-orange-500" />
            Menor Engajamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">{lowestProduct?.productName || 'N/A'}</div>
          <div className="text-xs text-muted-foreground flex justify-between mt-1">
            <span>Engajamento:</span>
            <Badge variant="outline" className="text-[10px] h-4">
              {lowestProduct?.averageEngagementLevel || 'N/A'}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground flex justify-between">
            <span>Ativos:</span>
            <span className="font-medium">{lowestProduct?.activeClients || 0}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            Maior Risco Churn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">{highestRiskProduct?.productName || 'N/A'}</div>
          <div className="text-xs text-muted-foreground flex justify-between mt-1">
            <span>Em Risco:</span>
            <span className="font-medium text-red-600">{highestRiskProduct?.churnRiskPercentage || 0}%</span>
          </div>
          <div className="text-xs text-muted-foreground flex justify-between">
            <span>Qtd:</span>
            <span className="font-medium">{highestRiskProduct?.churnRiskCount || 0}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
