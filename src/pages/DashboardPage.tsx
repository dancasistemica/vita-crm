import { useCRMStore } from "@/store/crmStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['hsl(350,35%,55%)', 'hsl(18,50%,58%)', 'hsl(38,92%,50%)', 'hsl(152,55%,45%)', 'hsl(210,70%,55%)', 'hsl(280,40%,55%)', 'hsl(350,35%,70%)', 'hsl(20,25%,40%)'];

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display text-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users} label="Total de Leads" value={totalLeads} />
        <MetricCard icon={Target} label="Clientes" value={clients} />
        <MetricCard icon={TrendingUp} label="Taxa de Conversão" value={`${conversionRate}%`} />
        <MetricCard icon={DollarSign} label="Receita Total" value={`R$ ${totalRevenue.toLocaleString('pt-BR')}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base font-display">Leads por Etapa do Funil</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsByStage}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(350,35%,55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-display">Leads por Origem</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={leadsByOrigin} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {leadsByOrigin.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {revenueByProduct.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base font-display">Receita por Produto</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByProduct}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
                  <Bar dataKey="value" fill="hsl(18,50%,58%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
