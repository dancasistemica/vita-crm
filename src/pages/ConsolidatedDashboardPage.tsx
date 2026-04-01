import { Card, Skeleton } from "@/components/ui/ds";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, DollarSign, TrendingUp, Target, Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useDashboardData } from "@/hooks/useDashboardData";
import FilterPeriod, { type DateRange } from "@/components/dashboard/FilterPeriod";
import StuckLeadsAlert from "@/components/dashboard/StuckLeadsAlert";
import StageMetrics from "@/components/dashboard/StageMetrics";
import ProductInsights from "@/components/dashboard/ProductInsights";

const COLORS = ['hsl(346,38%,52%)', 'hsl(16,50%,56%)', 'hsl(38,92%,50%)', 'hsl(152,55%,42%)', 'hsl(210,70%,55%)', 'hsl(280,40%,55%)', 'hsl(346,38%,68%)', 'hsl(220,20%,40%)'];

export default function ConsolidatedDashboardPage() {
  const navigate = useNavigate();

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { start, end, label: '30 dias' };
  });

  const { totalLeads = 0, clients = 0, conversionRate = '0', totalRevenue = 0, totalSales = 0, recurringClients = 0, ticketMedio = 0, topProducts = [], salesByDay = [], leadsByStage = [], leadsByOrigin = [], revenueByProduct = [], stuckLeads = [], stageMetrics = [], loading, consolidatedData, productInsights } = useDashboardData(dateRange, true);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900">📊 Dashboard Consolidado</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Carregando...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="shadow-card border-border/60">
              <div><Skeleton className="h-16 w-full" /></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const metrics = [
    { icon: Building2, label: "Organizações Ativas", value: consolidatedData?.totalOrganizations ?? 0, color: 'bg-info/10 text-info' },
    { icon: Users, label: "Total de Leads", value: totalLeads, color: 'bg-primary/10 text-primary' },
    { icon: Target, label: "Clientes", value: clients, color: 'bg-success/10 text-success' },
    { icon: TrendingUp, label: "Taxa de Conversão", value: `${conversionRate}%`, color: 'bg-info/10 text-info' },
    { icon: DollarSign, label: "Receita Total", value: `R$ ${totalRevenue.toLocaleString('pt-BR')}`, color: 'bg-accent/10 text-accent' },
    { icon: DollarSign, label: "Total de Vendas", value: totalSales, color: 'bg-primary/10 text-primary' },
    { icon: Users, label: "Clientes Recorrentes", value: recurringClients, color: 'bg-accent/10 text-accent' },
    { icon: DollarSign, label: "Ticket Médio", value: `R$ ${ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: 'bg-info/10 text-info' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-neutral-900">📊 Dashboard Consolidado</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Visão 360° de <strong>todas as organizações</strong></p>
      </div>

      <FilterPeriod onPeriodChange={setDateRange} selectedLabel={dateRange.label} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <Card key={i} className="shadow-card hover-lift border-border/60 animate-slide-up" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}>
            <div>
              <div className="flex items-center gap-3.5">
                <div className={`p-2.5 rounded-xl ${m.color}`}>
                  <m.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{m.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">{m.value}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Top Organizations */}
      {consolidatedData && consolidatedData.topOrganizations.length > 0 && (
        <Card className="shadow-card border-border/60">
          <div className="mb-4"><h2 className="text-2xl font-semibold mb-2">🏆 Top Organizações por Receita</h2></div>
          <div>
            <div className="space-y-3">
              {consolidatedData.topOrganizations.map((org, index) => (
                <div key={org.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-neutral-500">#{index + 1}</span>
                    <div>
                      <p className="font-semibold text-foreground">{org.name}</p>
                      <p className="text-sm text-neutral-500">{org.leads} leads · {org.conversionRate.toFixed(1)}% conversão</p>
                    </div>
                  </div>
                  <p className="font-bold text-success">R$ {org.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      <StuckLeadsAlert stuckLeads={stuckLeads} onLeadClick={() => navigate('/leads')} />

      {stageMetrics.length > 0 && (
        <>
          <h2 className="text-2xl font-semibold text-neutral-900">Métricas por Etapa</h2>
          <StageMetrics metrics={stageMetrics} />
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card border-border/60">
          <div className="mb-4"><h2 className="text-2xl font-semibold mb-2">Leads por Etapa do Funil</h2></div>
          <div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsByStage}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} />
                <div className="relative group">
                <Bar dataKey="value" fill="hsl(270,50%,55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="shadow-card border-border/60">
          <div className="mb-4"><h2 className="text-2xl font-semibold mb-2">Leads por Organização</h2></div>
          <div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={consolidatedData ? consolidatedData.topOrganizations.map(o => ({ name: o.name, value: o.leads })) : leadsByOrigin} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {(consolidatedData ? consolidatedData.topOrganizations : leadsByOrigin).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <div className="relative group">
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {revenueByProduct.length > 0 && (
          <Card className="shadow-card border-border/60">
            <div className="mb-4"><h2 className="text-2xl font-semibold mb-2">Receita por Produto</h2></div>
            <div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByProduct}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <div className="relative group"> `R$ ${(v ?? 0).toLocaleString('pt-BR')}`} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220 13% 91%)' }} />
                  <Bar dataKey="value" fill="hsl(16,50%,56%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {topProducts.length > 0 && (
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
        )}

        {salesByDay.length > 0 && (
          <Card className="shadow-card border-border/60">
            <div className="mb-4"><h2 className="text-2xl font-semibold mb-2">📈 Vendas Recentes ({dateRange.label})</h2></div>
            <div>
              <div className="space-y-3">
                {salesByDay.slice(-7).map((day) => (
                  <div key={day.day} className="flex items-center gap-3">
                    <span className="text-sm text-neutral-500 w-24">{day.day}</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(day.value / Math.max(...salesByDay.map(d => d.value), 1)) * 100}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-32 text-right">R$ {day.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {productInsights && (
        <ProductInsights insights={productInsights} isSuperadmin={true} />
      )}
    </div>
  );
}
