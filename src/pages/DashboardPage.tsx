import { Card, Skeleton } from "@/components/ui/ds";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, DollarSign, TrendingUp, Target, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import AIWeeklySummary from "@/components/ai/AIWeeklySummary";
import { useDashboardData } from "@/hooks/useDashboardData";
import TaskMetricsCards from "@/components/dashboard/TaskMetricsCards";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/hooks/useAuth";
import FilterPeriod, { type DateRange } from "@/components/dashboard/FilterPeriod";
import StuckLeadsAlert from "@/components/dashboard/StuckLeadsAlert";
import StageMetrics from "@/components/dashboard/StageMetrics";
import ProductInsights from "@/components/dashboard/ProductInsights";
import DashboardCustomizer from "@/components/dashboard/DashboardCustomizer";
import { useDashboardSettings } from "@/hooks/useDashboardSettings";
import { useUserRole } from "@/hooks/useUserRole";
import { calculateDashboardMetrics, type DashboardMetrics } from "@/services/dashboardService";
import ExecutiveMetrics from "@/components/dashboard/ExecutiveMetrics";
import SalesMetrics from "@/components/dashboard/SalesMetrics";
import AttendanceMetrics from "@/components/dashboard/AttendanceMetrics";
import AlertsSummary from "@/components/dashboard/AlertsSummary";
import IntegrationStatus from "@/components/dashboard/IntegrationStatus";
import QuickActions from "@/components/dashboard/QuickActions";
import { Button } from "@/components/ui/ds";

const COLORS = ['hsl(346,38%,52%)', 'hsl(16,50%,56%)', 'hsl(38,92%,50%)', 'hsl(152,55%,42%)', 'hsl(210,70%,55%)', 'hsl(280,40%,55%)', 'hsl(346,38%,68%)', 'hsl(220,20%,40%)'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { organization, organizationId } = useOrganization();
  const { canAccessSettings, isSuperadmin } = useUserRole();
  const { settings, toggleVisibility, reorder } = useDashboardSettings(organizationId);

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { start, end, label: '30 dias' };
  });

  const [execMetrics, setExecMetrics] = useState<DashboardMetrics | null>(null);
  const [execLoading, setExecLoading] = useState(false);

  const { 
    totalLeads = 0, 
    clients = 0, 
    conversionRate = '0', 
    totalRevenue = 0, 
    totalSales = 0, 
    recurringClients = 0, 
    ticketMedio = 0, 
    predictedRevenue = 0, 
    predictedLeadsCount = 0, 
    topProducts = [], 
    salesByDay = [], 
    leadsByStage = [], 
    leadsByOrigin = [], 
    revenueByProduct = [], 
    stuckLeads = [], 
    stageMetrics = [], 
    loading, 
    productInsights 
  } = useDashboardData(dateRange);

  useEffect(() => {
    const fetchExecMetrics = async () => {
      if (!organizationId) return;
      setExecLoading(true);
      try {
        const days = Math.floor((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) || 30;
        const data = await calculateDashboardMetrics(organizationId, undefined, days);
        setExecMetrics(data);
      } catch (error) {
        console.error("Erro ao carregar métricas executivas:", error);
      } finally {
        setExecLoading(false);
      }
    };

    fetchExecMetrics();
  }, [organizationId, dateRange]);

  const metrics = [
    { icon: Users, label: "Total de Leads", value: totalLeads ?? 0, color: 'bg-primary/10 text-primary' },
    { icon: Target, label: "Clientes", value: clients ?? 0, color: 'bg-success/10 text-success' },
    { icon: TrendingUp, label: "Taxa de Conversão", value: `${conversionRate ?? '0'}%`, color: 'bg-info/10 text-info' },
    { icon: DollarSign, label: "Receita Total", value: `R$ ${(totalRevenue ?? 0).toLocaleString('pt-BR')}`, color: 'bg-accent/10 text-accent' },
    { icon: DollarSign, label: "Receita Prevista", value: `R$ ${(predictedRevenue ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, subtitle: `${predictedLeadsCount} leads ativos`, color: 'bg-warning/10 text-warning' },
    { icon: DollarSign, label: "Total de Vendas", value: totalSales ?? 0, color: 'bg-primary/10 text-primary' },
    { icon: Users, label: "Clientes Recorrentes", value: recurringClients ?? 0, color: 'bg-accent/10 text-accent' },
    { icon: DollarSign, label: "Ticket Médio", value: `R$ ${(ticketMedio ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'bg-info/10 text-info' },
  ];

  const cardRenderers: Record<string, () => React.ReactNode> = {
    executive_metrics: () => execMetrics ? <ExecutiveMetrics metrics={execMetrics} /> : (execLoading ? <Skeleton className="h-32 w-full" /> : null),
    quick_actions: () => <QuickActions />,
    sales_metrics: () => execMetrics ? <SalesMetrics metrics={execMetrics} /> : (execLoading ? <Skeleton className="h-[300px] w-full" /> : null),
    attendance_metrics: () => execMetrics ? <AttendanceMetrics metrics={execMetrics} /> : (execLoading ? <Skeleton className="h-[300px] w-full" /> : null),
    alerts_summary: () => execMetrics ? <AlertsSummary metrics={execMetrics} /> : (execLoading ? <Skeleton className="h-[300px] w-full" /> : null),
    integration_status: () => execMetrics ? <IntegrationStatus metrics={execMetrics} /> : (execLoading ? <Skeleton className="h-[300px] w-full" /> : null),
    metrics_grid: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <Card key={i} className="shadow-card hover-lift border-border/60 animate-slide-up" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}>
            <div className="flex items-center gap-3.5">
              <div className={`p-2.5 rounded-xl ${m.color}`}>
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{m.label}</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{m.value}</p>
                {'subtitle' in m && m.subtitle && <p className="text-xs text-neutral-500">{m.subtitle}</p>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    ),
    tarefas_metricas: () => <TaskMetricsCards />,
    leads_parados: () => <StuckLeadsAlert stuckLeads={stuckLeads} onLeadClick={() => navigate('/leads')} />,
    metricas_estagio: () => stageMetrics.length > 0 ? (
      <>
        <h2 className="text-2xl font-semibold text-neutral-900">Métricas por Etapa</h2>
        <StageMetrics metrics={stageMetrics} />
      </>
    ) : null,
    leads_por_estagio: () => (
      <Card className="shadow-card border-border/60">
        <div className="mb-4"><h2 className="text-2xl font-semibold mb-2">Leads por Etapa do Funil</h2></div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leadsByStage}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(346,38%,52%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    ),
    leads_por_origem: () => (
      <Card className="shadow-card border-border/60">
        <div className="mb-4"><h2 className="text-2xl font-semibold mb-2">Leads por Origem</h2></div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={leadsByOrigin} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {leadsByOrigin.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    ),
    receita_por_produto: () => revenueByProduct.length > 0 ? (
      <Card className="shadow-card border-border/60">
        <div className="mb-4"><h2 className="text-2xl font-semibold mb-2">Receita por Produto</h2></div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByProduct}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(v: any) => `R$ ${(v ?? 0).toLocaleString('pt-BR')}`} />
              <Bar dataKey="value" fill="hsl(16,50%,56%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    ) : null,
    top_produtos: () => topProducts.length > 0 ? (
      <Card className="shadow-card border-border/60">
        <div className="mb-4"><h2 className="text-2xl font-semibold mb-2">🏆 Top 5 Produtos</h2></div>
        <div>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-neutral-500">#{index + 1}</span>
                  <div>
                    <p className="font-semibold text-foreground">{product.name}</p>
                    <p className="text-sm text-neutral-500">{product.count} vendas</p>
                  </div>
                </div>
                <p className="font-bold text-success">R$ {product.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    ) : null,
    vendas_recentes: () => salesByDay.length > 0 ? (
      <Card className="shadow-card border-border/60">
        <div className="mb-4"><h2 className="text-2xl font-semibold mb-2">📈 Vendas Recentes ({dateRange.label})</h2></div>
        <div>
          <div className="space-y-3">
            {salesByDay.slice(-7).map((day) => (
              <div key={day.day} className="flex items-center gap-2 sm:gap-3 flex-nowrap overflow-hidden">
                <span className="text-xs sm:text-sm text-neutral-500 min-w-[60px] sm:w-24 shrink-0">{day.day}</span>
                <div className="flex-1 bg-muted rounded-full h-2 min-w-0">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${(day.value / Math.max(...salesByDay.map(d => d.value), 1)) * 100}%` }} />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-foreground min-w-[80px] sm:w-32 text-right shrink-0">
                  R$ {day.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    ) : null,
    resumo_ia: () => <AIWeeklySummary />,
    insights_produtos: () => productInsights ? <ProductInsights insights={productInsights} isSuperadmin={false} /> : null,
  };

  const fullWidthCards = new Set([
    'executive_metrics', 
    'metrics_grid', 
    'tarefas_metricas', 
    'leads_parados', 
    'metricas_estagio', 
    'insights_produtos',
    'quick_actions'
  ]);

  const sortedVisible = settings.filter(s => s.is_visible).sort((a, b) => a.position - b.position);

  if (loading && !execMetrics) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 py-4 sm:p-6">
      <div className="flex items-center justify-between flex-wrap gap-4 px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">📊 Dashboard</h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 font-medium">
            Dados de <strong className="text-neutral-700">{organization?.name || 'sua organização'}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {(canAccessSettings || isSuperadmin) && (
            <DashboardCustomizer
              settings={settings}
              onToggleVisibility={toggleVisibility}
              onReorder={reorder}
            />
          )}
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="hidden sm:flex gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Recarregar
          </Button>
        </div>
      </div>

      <FilterPeriod onPeriodChange={setDateRange} selectedLabel={dateRange.label} />

      {(() => {
        const elements: React.ReactNode[] = [];
        let gridBuffer: React.ReactNode[] = [];

        const flushGrid = () => {
          if (gridBuffer.length > 0) {
            elements.push(
              <div key={`grid-${elements.length}`} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {gridBuffer}
              </div>
            );
            gridBuffer = [];
          }
        };

        sortedVisible.forEach(s => {
          const renderer = cardRenderers[s.card_id];
          if (!renderer) return;
          const content = renderer();
          if (!content) return;

          if (fullWidthCards.has(s.card_id)) {
            flushGrid();
            elements.push(<div key={s.card_id}>{content}</div>);
          } else {
            gridBuffer.push(<div key={s.card_id}>{content}</div>);
          }
        });

        flushGrid();
        return elements;
      })()}
    </div>
  );
}
