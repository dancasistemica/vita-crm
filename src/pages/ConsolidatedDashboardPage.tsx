import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, TrendingUp, Target, Building2, Globe, ArrowLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserRole } from "@/hooks/useUserRole";
import FilterPeriod, { type DateRange } from "@/components/dashboard/FilterPeriod";
import StuckLeadsAlert from "@/components/dashboard/StuckLeadsAlert";
import StageMetrics from "@/components/dashboard/StageMetrics";
import ProductInsights from "@/components/dashboard/ProductInsights";

const COLORS = ['hsl(346,38%,52%)', 'hsl(16,50%,56%)', 'hsl(38,92%,50%)', 'hsl(152,55%,42%)', 'hsl(210,70%,55%)', 'hsl(280,40%,55%)', 'hsl(346,38%,68%)', 'hsl(220,20%,40%)'];

export default function ConsolidatedDashboardPage() {
  const navigate = useNavigate();
  const { isSuperadmin, loading: roleLoading } = useUserRole();

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { start, end, label: '30 dias' };
  });

  // Redirect non-superadmin to individual dashboard
  useEffect(() => {
    if (!roleLoading && !isSuperadmin) {
      console.log('[ConsolidatedDashboardPage] Redirecionando non-superadmin para /');
      navigate('/');
    }
  }, [isSuperadmin, roleLoading, navigate]);

  const { totalLeads = 0, clients = 0, conversionRate = '0', totalRevenue = 0, totalSales = 0, recurringClients = 0, ticketMedio = 0, topProducts = [], salesByDay = [], leadsByStage = [], leadsByOrigin = [], revenueByProduct = [], stuckLeads = [], stageMetrics = [], loading, consolidatedData, productInsights } = useDashboardData(dateRange);

  if (roleLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-600/90 to-purple-400/60 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3">
            <Globe className="h-7 w-7" />
            <div>
              <h1 className="text-2xl font-display">Dashboard Consolidado</h1>
              <p className="text-sm opacity-80 mt-0.5">Carregando...</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="shadow-card border-border/60">
              <CardContent className="pt-5 pb-4"><Skeleton className="h-16 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!isSuperadmin) return null;

  const metrics = [
    { icon: Building2, label: "Organizações", value: consolidatedData?.totalOrganizations ?? 0, color: 'bg-info/10 text-info' },
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
      <div className="bg-gradient-to-r from-purple-600/90 to-purple-400/60 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Globe className="h-7 w-7" />
            <div>
              <h1 className="text-2xl font-display">Dashboard Consolidado</h1>
              <p className="text-sm opacity-80 mt-0.5">Visão 360° de <strong>todas as organizações</strong></p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/')} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Dashboard Individual
          </Button>
        </div>
      </div>

      {/* Warning banner */}
      <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-xs text-yellow-800 dark:text-yellow-200">
          ⚠️ <strong>Modo Consolidado Ativo:</strong> Os dados abaixo representam o agregado de todas as organizações.
        </p>
      </div>

      <FilterPeriod onPeriodChange={setDateRange} selectedLabel={dateRange.label} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <Card key={i} className="shadow-card hover-lift border-border/60 animate-slide-up" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3.5">
                <div className={`p-2.5 rounded-xl ${m.color}`}>
                  <m.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{m.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">{m.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Organizations */}
      {consolidatedData && consolidatedData.topOrganizations.length > 0 && (
        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-base font-display">🏆 Top Organizações por Receita</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {consolidatedData.topOrganizations.map((org, index) => (
                <div key={org.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                    <div>
                      <p className="font-semibold text-foreground">{org.name}</p>
                      <p className="text-sm text-muted-foreground">{org.leads} leads · {org.conversionRate.toFixed(1)}% conversão</p>
                    </div>
                  </div>
                  <p className="font-bold text-success">R$ {org.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <StuckLeadsAlert stuckLeads={stuckLeads} onLeadClick={() => navigate('/leads')} />

      {stageMetrics.length > 0 && (
        <>
          <h2 className="text-lg font-display text-foreground">Métricas por Etapa</h2>
          <StageMetrics metrics={stageMetrics} />
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-base font-display">Leads por Etapa do Funil</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsByStage}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220 13% 91%)', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.06)' }} />
                <Bar dataKey="value" fill="hsl(270,50%,55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-base font-display">Leads por Organização</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={consolidatedData ? consolidatedData.topOrganizations.map(o => ({ name: o.name, value: o.leads })) : leadsByOrigin} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {(consolidatedData ? consolidatedData.topOrganizations : leadsByOrigin).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220 13% 91%)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {revenueByProduct.length > 0 && (
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
        )}

        {topProducts.length > 0 && (
          <Card className="shadow-card border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-base font-display">🏆 Top 5 Produtos</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-semibold text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.count} vendas</p>
                      </div>
                    </div>
                    <p className="font-bold text-success">R$ {product.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {salesByDay.length > 0 && (
          <Card className="shadow-card border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-base font-display">📈 Vendas Recentes ({dateRange.label})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {salesByDay.slice(-7).map((day) => (
                  <div key={day.day} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-24">{day.day}</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(day.value / Math.max(...salesByDay.map(d => d.value), 1)) * 100}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-32 text-right">R$ {day.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {productInsights && (
        <ProductInsights insights={productInsights} isSuperadmin={true} />
      )}
    </div>
  );
}
