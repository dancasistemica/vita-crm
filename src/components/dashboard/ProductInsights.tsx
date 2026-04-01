import { Alert, Card } from "@/components/ui/ds";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Target, AlertCircle, Zap } from "lucide-react";

export interface ProductInsightsData {
  topProducts: { name: string; sales: number; revenue: number; percentOfTotal: number }[];
  conversionBenchmark: {
    overallRate: number;
    byStage: { stage: string; rate: number; leadsCount: number; isBottleneck: boolean }[];
  };
  funnelAnalysis: {
    totalLeads: number;
    byStage: { stage: string; leads: number; converted: number; conversionRate: number; progressionRate: number; nextStageName: string | null; avgDaysInStage: number; isFinalStage: boolean }[];
    bottleneckStage: string | null;
    recommendedOptimization: string;
  };
  usagePatterns: {
    leadsPerDay: number;
    conversionPerDay: number;
    avgTimeToConvert: number;
    seasonality: string;
  };
}

interface ProductInsightsProps {
  insights: ProductInsightsData;
  isSuperadmin: boolean;
}

export default function ProductInsights({ insights, isSuperadmin }: ProductInsightsProps) {
  if (!insights) return null;

  return (
    <div className="space-y-6">
      {/* TIER 1: TOP 5 PRODUTOS */}
      {insights.topProducts.length > 0 && (
        <Card className="shadow-card border-border/60">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold mb-2">
              <Target className="h-5 w-5 text-primary" />
              Top 5 Produtos por Receita
            </h2>
          </div>
          <div>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insights.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" allowDecimals={false} />
                  {isSuperadmin && <YAxis yAxisId="right" orientation="right" />}
                  <div className="relative group">
                  <Legend />
                  <Bar yAxisId="left" dataKey="sales" fill="hsl(210,70%,55%)" name="Vendas" radius={[4, 4, 0, 0]} />
                  {isSuperadmin && (
                    <Bar yAxisId="right" dataKey="revenue" fill="hsl(38,92%,50%)" name="Receita (R$)" radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {insights.topProducts.map((product, idx) => (
                <div key={idx} className="bg-muted/50 rounded-lg p-3 border border-border/40">
                  <p className="text-xs text-neutral-500">#{idx + 1}</p>
                  <p className="font-semibold text-foreground text-sm truncate">{product.name}</p>
                  <p className="text-lg font-bold text-primary mt-1">{product.sales} vendas</p>
                  <p className="text-xs text-neutral-500">{product.percentOfTotal.toFixed(1)}% do total</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* TIER 2: TAXA DE CONVERSÃO (ISOLADA) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card border-border/60 bg-gradient-to-br from-success/5 to-success/10">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold mb-2">📊 Taxa de Conversão</h2>
          </div>
          <div>
            <p className="text-5xl font-bold text-success mb-2">
              {insights.conversionBenchmark.overallRate.toFixed(1)}%
            </p>
            <p className="text-sm text-neutral-500">
              {insights.conversionBenchmark.overallRate > 0
                ? `${Math.round(insights.conversionBenchmark.overallRate * insights.funnelAnalysis.totalLeads / 100)} conversões de ${insights.funnelAnalysis.totalLeads} leads`
                : 'Nenhum lead neste período'
              }
            </p>
          </div>
        </Card>

        <Card className="shadow-card border-border/60">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold mb-2">📈 Conversão por Etapa</h2>
          </div>
          <div>
            <div className="space-y-3">
              {insights.conversionBenchmark.byStage.map((stage) => (
                <div key={stage.stage} className={`p-3 rounded-lg ${stage.isBottleneck ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted/50'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-foreground text-sm">{stage.stage}</p>
                    <p className={`text-lg font-bold ${stage.isBottleneck ? 'text-destructive' : 'text-success'}`}>
                      {stage.rate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${stage.isBottleneck ? 'bg-destructive' : 'bg-success'}`}
                      style={{ width: `${Math.min(stage.rate, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">{stage.leadsCount} leads</p>
                  {stage.isBottleneck && (
                    <p className="text-xs text-destructive font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Gargalo detectado
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* TIER 3: ANÁLISE DO FUNIL */}
      {insights.funnelAnalysis.byStage.length > 0 && (
        <Card className="shadow-card border-border/60">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold mb-2">
              <Zap className="h-5 w-5 text-warning" />
              Análise do Funil de Vendas
            </h2>
          </div>
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="text-left p-2 font-semibold text-foreground">Etapa</th>
                      <th className="text-center p-2 font-semibold text-foreground">Leads</th>
                      <th className="text-center p-2 font-semibold text-foreground">Conv.</th>
                      <th className="text-center p-2 font-semibold text-foreground">Taxa</th>
                      <th className="text-center p-2 font-semibold text-foreground">Dias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insights.funnelAnalysis.byStage.map((stage) => (
                      <tr key={stage.stage} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-2 font-semibold text-foreground">
                          {stage.stage}
                          {stage.isFinalStage && <span className="text-xs text-success ml-1">✓ Final</span>}
                        </td>
                        <td className="p-2 text-center text-neutral-500">{stage.leads}</td>
                        <td className="p-2 text-center text-success font-semibold">{stage.converted}</td>
                        <td className="p-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            stage.conversionRate >= 20 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                          }`}>
                            {stage.conversionRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-2 text-center text-neutral-500">{stage.avgDaysInStage}d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-info/5 rounded-lg p-6 border border-info/20 flex flex-col justify-center">
                <h4 className="text-base font-bold text-foreground mb-3">💡 Recomendação</h4>
                <p className="text-sm text-neutral-500 mb-4">{insights.funnelAnalysis.recommendedOptimization}</p>
                {insights.funnelAnalysis.bottleneckStage && (
                  <div className="bg-card rounded-lg p-4 border border-border/60">
                    <p className="text-sm font-semibold text-foreground mb-2">🎯 Foco: {insights.funnelAnalysis.bottleneckStage}</p>
                    <ul className="text-sm text-neutral-500 space-y-1">
                      <li>✓ Revisar critérios de qualificação</li>
                      <li>✓ Treinar equipe de vendas</li>
                      <li>✓ Melhorar materiais de apresentação</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Taxa de Progresso Sequencial */}
            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-foreground mb-2">📊 Taxa de Progresso Sequencial</h4>
              <p className="text-xs text-neutral-500 mb-3">De 100% dos leads em cada etapa, quantos % avançam para a próxima?</p>
              <div className="space-y-3">
                {insights.funnelAnalysis.byStage
                  .filter((stage) => !stage.isFinalStage)
                  .map((stage) => (
                    <div key={stage.stage} className="bg-card rounded-lg p-3 border border-border/40">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-foreground text-sm">{stage.stage} → {stage.nextStageName}</p>
                          <p className="text-xs text-neutral-500">De {stage.leads} leads</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{stage.progressionRate.toFixed(0)}%</p>
                          <p className="text-xs text-neutral-500">{Math.round((stage.progressionRate / 100) * stage.leads)} avançam</p>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            stage.progressionRate >= 50 ? 'bg-success' :
                            stage.progressionRate >= 25 ? 'bg-warning' :
                            'bg-destructive'
                          }`}
                          style={{ width: `${Math.min(stage.progressionRate, 100)}%` }}
                        />
                      </div>
                      <div className="mt-1">
                        {stage.progressionRate >= 50 ? (
                          <span className="text-xs text-success font-semibold">✅ Saudável</span>
                        ) : stage.progressionRate >= 25 ? (
                          <span className="text-xs text-warning font-semibold">⚠️ Atenção</span>
                        ) : (
                          <span className="text-xs text-destructive font-semibold">🚨 Crítico</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TIER 4: PADRÕES DE USO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card border-border/60 border-l-4 border-l-info">
          <div>
            <p className="text-xs text-neutral-500 mb-1">📅 Leads por Dia</p>
            <p className="text-2xl font-bold text-info">{Number(insights.usagePatterns.leadsPerDay).toFixed(1)}</p>
            <p className="text-xs text-neutral-500 mt-1">Média do período</p>
          </div>
        </Card>
        <Card className="shadow-card border-border/60 border-l-4 border-l-success">
          <div>
            <p className="text-xs text-neutral-500 mb-1">✅ Conversões/Dia</p>
            <p className="text-2xl font-bold text-success">{Number(insights.usagePatterns.conversionPerDay).toFixed(1)}</p>
            <p className="text-xs text-neutral-500 mt-1">Média do período</p>
          </div>
        </Card>
        <Card className="shadow-card border-border/60 border-l-4 border-l-primary">
          <div>
            <p className="text-xs text-neutral-500 mb-1">⏱️ Tempo Médio</p>
            <p className="text-2xl font-bold text-primary">{Number(insights.usagePatterns.avgTimeToConvert).toFixed(1)}d</p>
            <p className="text-xs text-neutral-500 mt-1">Lead → Conversão</p>
          </div>
        </Card>
        <Card className="shadow-card border-border/60 border-l-4 border-l-warning">
          <div>
            <p className="text-xs text-neutral-500 mb-1">📊 Sazonalidade</p>
            <p className="text-2xl font-bold text-warning">
              {insights.usagePatterns.seasonality === 'high' ? '🔥 Alta' : insights.usagePatterns.seasonality === 'medium' ? '🔶 Média' : '🔵 Baixa'}
            </p>
          </div>
        </Card>
      </div>

      {/* INSIGHTS FINAIS */}
      <Card className="shadow-card border-border/60 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold mb-2">🎯 Insights Estratégicos</h2>
        </div>
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.topProducts[0] && (
              <div>
                <p className="font-semibold text-foreground mb-1 text-sm">📌 Produto Destaque</p>
                <p className="text-sm text-neutral-500">
                  <span className="font-bold text-foreground">{insights.topProducts[0].name}</span> gera{' '}
                  <span className="font-bold text-foreground">{insights.topProducts[0].percentOfTotal.toFixed(1)}%</span> da receita total
                </p>
              </div>
            )}
            <div>
              <p className="font-semibold text-foreground mb-1 text-sm">🚀 Oportunidade</p>
              <p className="text-sm text-neutral-500">
                Otimizar <span className="font-bold text-foreground">{insights.funnelAnalysis.bottleneckStage || 'funil'}</span> pode aumentar receita
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1 text-sm">⚡ Velocidade</p>
              <p className="text-sm text-neutral-500">
                Leads convertem em <span className="font-bold text-foreground">{insights.usagePatterns.avgTimeToConvert} dias</span> em média
              </p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1 text-sm">📊 Saúde</p>
              <p className="text-sm text-neutral-500">
                Taxa de conversão <span className="font-bold text-foreground">{insights.conversionBenchmark.overallRate.toFixed(1)}%</span>
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
