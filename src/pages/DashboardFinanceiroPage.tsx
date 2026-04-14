import React, { useEffect, useState } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import { calculateFinancialMetrics, FinancialMetrics } from '../services/financeService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/ds";
import { Progress } from "@/components/ui/ds";
import { DollarSign, TrendingUp, Users, ShoppingBag, PieChart, Activity } from "lucide-react";

export default function DashboardFinanceiroPage() {
  const { organizationId } = useOrganization();
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('[DashboardFinanceiroPage] 🔍 Organization ID recebido:', organizationId);
        console.log('[DashboardFinanceiroPage] 🔍 Tipo de organizationId:', typeof organizationId);
        console.log('[DashboardFinanceiroPage] 🔍 organizationId está vazio?', !organizationId);
        console.log('[DashboardFinanceiroPage] 📊 INICIANDO carregamento de métricas');
        console.log('[DashboardFinanceiroPage] Timestamp:', new Date().toISOString());

        const financialMetrics = await calculateFinancialMetrics(organizationId);
        
        console.log('[DashboardFinanceiroPage] ✅ Métricas recebidas:', financialMetrics);
        console.log('[DashboardFinanceiroPage] Tipo de totalRevenue:', typeof financialMetrics.totalRevenue);
        console.log('[DashboardFinanceiroPage] Tipo de mrrValue:', typeof financialMetrics.mrrValue);
        
        setMetrics(financialMetrics);

        console.log('[DashboardFinanceiroPage] ✅ Estado atualizado com métricas');
      } catch (err) {
        console.error('[DashboardFinanceiroPage] ❌ ERRO ao carregar métricas:', err);
        setError('Erro ao carregar métricas financeiras');
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      loadMetrics();
    }
  }, [organizationId]);

  console.log('[DashboardFinanceiroPage] 🔍 DEBUG - Estado atual:', {
    loading,
    error,
    metrics: metrics ? {
      totalRevenue: metrics.totalRevenue,
      mrrValue: metrics.mrrValue,
      uniqueSalesCount: metrics.uniqueSalesCount,
      subscriptionCount: metrics.subscriptionCount,
    } : null,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-5xl mb-4">⏳</div>
          <p className="text-slate-600 font-semibold">Carregando métricas financeiras...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-900 mb-2">❌ Erro ao Carregar Dashboard</h1>
            <p className="text-red-700">{error || 'Erro desconhecido'}</p>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">💰 Dashboard Financeiro</h1>
          <p className="text-slate-600">Análise de receita, MRR e performance de vendas</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* CARD 1: Receita Total */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-semibold uppercase tracking-wider">Receita Total</p>
              <span className="text-2xl">💵</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {metrics && metrics.totalRevenue !== undefined ? (
                `R$ ${metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              ) : (
                'R$ 0,00'
              )}
            </p>
            <p className="text-xs text-slate-500 mt-2">Vendas + Mensalidades (Ativas)</p>
          </div>

          {/* CARD 2: MRR */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-semibold uppercase tracking-wider">MRR</p>
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {metrics && metrics.mrrValue !== undefined ? (
                `R$ ${metrics.mrrValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              ) : (
                'R$ 0,00'
              )}
            </p>
            <p className="text-xs text-slate-500 mt-2">Receita Recorrente Mensal</p>
          </div>

          {/* CARD 3: Ticket Médio (Vendas Únicas) */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-semibold uppercase tracking-wider">Ticket Médio (Únicas)</p>
              <span className="text-2xl">🛍️</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {metrics && metrics.avgTicketUnique !== undefined ? (
                `R$ ${metrics.avgTicketUnique.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              ) : (
                'R$ 0,00'
              )}
            </p>
            <p className="text-xs text-slate-500 mt-2">Baseado em {metrics.uniqueSalesCount} vendas</p>
          </div>

          {/* CARD 4: Ticket Médio (Recorrente) */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 text-sm font-semibold uppercase tracking-wider">Ticket Médio (MRR)</p>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {metrics && metrics.avgTicketSubscription !== undefined ? (
                `R$ ${metrics.avgTicketSubscription.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              ) : (
                'R$ 0,00'
              )}
            </p>
            <p className="text-xs text-slate-500 mt-2">Baseado em {metrics.subscriptionCount} assinaturas</p>
          </div>
        </div>

        {/* DETALHAMENTO E COMPOSIÇÃO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Composição da Receita */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-slate-600" />
                Composição da Receita
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Recorrente (MRR)</span>
                  <span className="text-sm font-bold text-green-600">{metrics.subscriptionPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.subscriptionPercentage} className="h-3 bg-slate-100 [&>div]:bg-green-500" />
                <p className="text-xs text-slate-500 mt-1">{formatCurrency(metrics.mrrValue)} mensais</p>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Vendas Únicas</span>
                  <span className="text-sm font-bold text-blue-600">{metrics.uniquePercentage.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.uniquePercentage} className="h-3 bg-slate-100 [&>div]:bg-blue-500" />
                <p className="text-xs text-slate-500 mt-1">{formatCurrency(metrics.totalUniqueRevenue)} totais</p>
              </div>
            </CardContent>
          </Card>

          {/* Volume de Clientes/Vendas */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-600" />
                Volume de Transações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-slate-500 mb-1">Assinantes Ativos</p>
                  <p className="text-4xl font-extrabold text-slate-900">{metrics.subscriptionCount}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-slate-500 mb-1">Vendas Únicas</p>
                  <p className="text-4xl font-extrabold text-slate-900">{metrics.uniqueSalesCount}</p>
                </div>
              </div>
              <div className="mt-6 p-4 border border-blue-100 bg-blue-50 rounded-lg">
                <h4 className="text-blue-900 font-semibold mb-1 text-sm">💡 Insight Estratégico</h4>
                <p className="text-blue-700 text-xs">
                  {metrics.subscriptionPercentage > 60 
                    ? "Sua base é predominantemente recorrente. Foco em retenção (LTV) é prioridade." 
                    : "Sua receita depende muito de novas vendas únicas. Considere estratégias para aumentar o MRR."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
