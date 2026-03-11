import { useCRMStore } from "@/store/crmStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['hsl(346,38%,52%)', 'hsl(16,50%,56%)', 'hsl(38,92%,50%)', 'hsl(152,55%,42%)', 'hsl(210,70%,55%)', 'hsl(280,40%,55%)', 'hsl(346,38%,68%)', 'hsl(220,20%,40%)'];

export default function DashboardPage() {
  const { leads, sales, products, pipelineStages, origins } = useCRMStore();

  const totalLeads = leads.length;
  const clients = leads.filter(l => l.pipelineStage === '7').length;
  const conversionRate = totalLeads ? ((clients / totalLeads) * 100).toFixed(1) : '0';
  const totalRevenue = sales.reduce((sum, s) => sum + s.value, 0);

  const leadsByOrigin = origins.map(o => ({
    name: o.length > 15 ? o.slice(0, 15) + '…' : o,
    value: leads.filter(l => l.origin === o).length,
  })).filter(x => x.value > 0);

  const leadsByStage = pipelineStages.map(s => ({
    name: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name,
    value: leads.filter(l => l.pipelineStage === s.id).length,
  }));

  const revenueByProduct = products.map(p => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name,
    value: sales.filter(s => s.productId === p.id).reduce((sum, s) => sum + s.value, 0),
  })).filter(x => x.value > 0);

  const metrics = [
    { icon: Users, label: "Total de Leads", value: totalLeads, color: 'bg-primary/10 text-primary' },
    { icon: Target, label: "Clientes", value: clients, color: 'bg-success/10 text-success' },
    { icon: TrendingUp, label: "Taxa de Conversão", value: `${conversionRate}%`, color: 'bg-info/10 text-info' },
    { icon: DollarSign, label: "Receita Total", value: `R$ ${totalRevenue.toLocaleString('pt-BR')}`, color: 'bg-accent/10 text-accent' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Visão geral do seu CRM</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-base font-display">Leads por Origem</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={leadsByOrigin} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {leadsByOrigin.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220 13% 91%)' }} />
                  <Bar dataKey="value" fill="hsl(16,50%,56%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
