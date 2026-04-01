import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Skeleton } from "@/components/ui/ds";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, DollarSign, TrendingUp, Target } from "lucide-react";
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

const COLORS = ['hsl(346,38%,52%)', 'hsl(16,50%,56%)', 'hsl(38,92%,50%)', 'hsl(152,55%,42%)', 'hsl(210,70%,55%)', 'hsl(280,40%,55%)', 'hsl(346,38%,68%)', 'hsl(220,20%,40%)'];

export default function DashboardPage() {
  const { user } = useAuth();
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

  const { totalLeads = 0, clients = 0, conversionRate = '0', totalRevenue = 0, totalSales = 0, recurringClients = 0, ticketMedio = 0, predictedRevenue = 0, predictedLeadsCount = 0, topProducts = [], salesByDay = [], leadsByStage = [], leadsByOrigin = [], revenueByProduct = [], stuckLeads = [], stageMetrics = [], loading, productInsights } = useDashboardData(dateRange);

  const isCardVisible = (cardId: string) => {
    const s = settings.find(s => s.card_id === cardId);
    return s ? s.is_visible : true;
  };

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Visão geral do seu CRM</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="shadow-card border-border/60">
              <CardContent className="pt-5 pb-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Map card_id to rendered content
  const cardRenderers: Record<string, () => React.ReactNode> = {
    metrics_grid: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <Card key={i} className="shadow-card hover-lift border-border/60 animate-slide-up" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}>
            <CardContent className="pt-5 pb-4">
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
            </CardContent>
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
        <CardHeader className="pb-2"><CardTitle className="text-base font-display">Leads por Etapa do Funil</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leadsByStage}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220 13% 91%)', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.06)' }} />
              <Bar dataKey="value" fill="hsl(346,38%,52%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    ),
    leads_por_origem: () => (
      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-base font-display">Leads por Origem</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={leadsByOrigin} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {leadsByOrigin.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220 13% 91%)' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    ),
    receita_por_produto: () => revenueByProduct.length > 0 ? (
      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-base font-display">Receita por Produto</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByProduct}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(v: number) => `R$ ${(v ?? 0).toLocaleString('pt-BR')}`} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220 13% 91%)' }} />
              <Bar dataKey="value" fill="hsl(16,50%,56%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    ) : null,
    top_produtos: () => topProducts.length > 0 ? (
      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-base font-display">🏆 Top 5 Produtos</CardTitle></CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    ) : null,
    vendas_recentes: () => salesByDay.length > 0 ? (
      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-base font-display">📈 Vendas Recentes ({dateRange.label})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {salesByDay.slice(-7).map((day) => (
              <div key={day.day} className="flex items-center gap-3">
                <span className="text-sm text-neutral-500 w-24">{day.day}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${(day.value / Math.max(...salesByDay.map(d => d.value), 1)) * 100}%` }} />
                </div>
                <span className="text-sm font-semibold text-foreground w-32 text-right">R$ {day.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ) : null,
    resumo_ia: () => <AIWeeklySummary />,
    insights_produtos: () => productInsights ? <ProductInsights insights={productInsights} isSuperadmin={false} /> : null,
  };

  // Full-width cards that should not be inside the 2-col grid
  const fullWidthCards = new Set(['metrics_grid', 'tarefas_metricas', 'leads_parados', 'metricas_estagio', 'insights_produtos']);

  // Sort settings by position and split into full-width and grid cards
  const sortedVisible = settings.filter(s => s.is_visible).sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900">📊 Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Dados de <strong>{organization?.name || 'sua organização'}</strong>
          </p>
        </div>
        {(canAccessSettings || isSuperadmin) && (
          <DashboardCustomizer
            settings={settings}
            onToggleVisibility={toggleVisibility}
            onReorder={reorder}
          />
        )}
      </div>

      <FilterPeriod onPeriodChange={setDateRange} selectedLabel={dateRange.label} />

      {/* Render cards in order, grouping grid-eligible cards into a 2-col grid */}
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
