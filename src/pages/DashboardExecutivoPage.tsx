import { useEffect, useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { PageTitle } from "@/components/ui/ds";
import { 
  getExecutiveDashboardData, 
  ExecutiveDashboardData 
} from "@/services/executiveDashboardService";
import { KeyMetricsCards } from "@/components/dashboard/KeyMetricsCards";
import { ExecutiveSummary } from "@/components/dashboard/ExecutiveSummary";
import { ProductComparisonChart } from "@/components/dashboard/ProductComparisonChart";
import { ChurnRiskMatrix } from "@/components/dashboard/ChurnRiskMatrix";
import { Skeleton } from "@/components/ui/ds";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/ds";
import { toast } from "sonner";

export default function DashboardExecutivoPage() {
  const { organizationId } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExecutiveDashboardData | null>(null);

  const loadData = async () => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      const dashboardData = await getExecutiveDashboardData(organizationId);
      setData(dashboardData);
    } catch (error) {
      console.error("Erro ao carregar dashboard executivo:", error);
      toast.error("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationId]);

  if (loading && !data) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <PageTitle>Dashboard Executivo</PageTitle>
          <p className="text-muted-foreground text-sm mt-1">
            Visão consolidada de desempenho por produto
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadData}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <KeyMetricsCards data={data} />

      <div className="grid gap-6">
        <ExecutiveSummary 
          topProduct={data.topPerformingProduct}
          lowestProduct={data.lowestPerformingProduct}
          highestRiskProduct={data.highestChurnRiskProduct}
        />
        
        <div className="grid gap-6 md:grid-cols-2">
          <ProductComparisonChart products={data.products} />
          <ChurnRiskMatrix products={data.products} />
        </div>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground italic">
        * Risco de Churn baseado em 7 dias sem acesso ou atividades registradas.
        Taxas financeiras em fase de integração com sistema de pagamentos.
      </div>
    </div>
  );
}
