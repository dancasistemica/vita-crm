import { useCRMStore } from "@/store/crmStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ['hsl(350,35%,55%)', 'hsl(18,50%,58%)', 'hsl(38,92%,50%)', 'hsl(152,55%,45%)', 'hsl(210,70%,55%)', 'hsl(280,40%,55%)'];

export default function RelatoriosPage() {
  const { leads, sales, products, pipelineStages, origins } = useCRMStore();

  const leadsByMonth = getLeadsByMonth(leads);
  const salesByMonth = getSalesByMonth(sales);
  const leadsByOrigin = origins.map(o => ({ name: o, value: leads.filter(l => l.origin === o).length })).filter(x => x.value > 0);
  const revenueByProduct = products.map(p => ({
    name: p.name,
    value: sales.filter(s => s.productId === p.id).reduce((sum, s) => sum + s.value, 0),
  })).filter(x => x.value > 0);
  const conversionByStage = pipelineStages.map(s => ({
    name: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name,
    value: leads.filter(l => l.pipelineStage === s.id).length,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-neutral-900">Relatórios</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base font-display">Leads por Mês</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={leadsByMonth}>
                <XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip />
                <Line type="monotone" dataKey="value" stroke="hsl(350,35%,55%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-display">Vendas por Mês (R$)</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByMonth}>
                <XAxis dataKey="month" /><YAxis /><Tooltip formatter={(v: number) => `R$ ${v}`} />
                <Bar dataKey="value" fill="hsl(18,50%,58%)" radius={[6, 6, 0, 0]} />
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

        <Card>
          <CardHeader><CardTitle className="text-base font-display">Receita por Produto</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByProduct} layout="vertical">
                <XAxis type="number" /><YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} /><Tooltip formatter={(v: number) => `R$ ${v}`} />
                <Bar dataKey="value" fill="hsl(152,55%,45%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base font-display">Funil de Conversão</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionByStage}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip />
                <Bar dataKey="value" fill="hsl(350,35%,55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getLeadsByMonth(leads: any[]) {
  const months: Record<string, number> = {};
  leads.forEach(l => {
    const m = l.entryDate?.slice(0, 7);
    if (m) months[m] = (months[m] || 0) + 1;
  });
  return Object.entries(months).sort().map(([month, value]) => ({ month, value }));
}

function getSalesByMonth(sales: any[]) {
  const months: Record<string, number> = {};
  sales.forEach(s => {
    const m = s.date?.slice(0, 7);
    if (m) months[m] = (months[m] || 0) + s.value;
  });
  return Object.entries(months).sort().map(([month, value]) => ({ month, value }));
}
