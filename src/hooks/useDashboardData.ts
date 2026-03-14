import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSuperadmin } from '@/hooks/useSuperadmin';

export interface StuckLead {
  id: string;
  name: string;
  email: string;
  stage: string;
  daysInStage: number;
}

export interface StageMetric {
  name: string;
  leadCount: number;
  conversionRate: number;
  avgDaysInStage: number;
}

interface DashboardData {
  totalLeads: number;
  clients: number;
  conversionRate: string;
  totalRevenue: number;
  totalSales: number;
  recurringClients: number;
  ticketMedio: number;
  topProducts: { name: string; count: number; revenue: number }[];
  salesByDay: { day: string; value: number }[];
  leadsByStage: { name: string; value: number }[];
  leadsByOrigin: { name: string; value: number }[];
  revenueByProduct: { name: string; value: number }[];
  stuckLeads: StuckLead[];
  stageMetrics: StageMetric[];
  loading: boolean;
}

const EMPTY_DATA: Omit<DashboardData, 'loading'> = {
  totalLeads: 0,
  clients: 0,
  conversionRate: '0',
  totalRevenue: 0,
  totalSales: 0,
  recurringClients: 0,
  ticketMedio: 0,
  topProducts: [],
  salesByDay: [],
  leadsByStage: [],
  leadsByOrigin: [],
  revenueByProduct: [],
  stuckLeads: [],
  stageMetrics: [],
};

export function useDashboardData(dateRange?: { start: Date; end: Date }): DashboardData {
  const { organizationId, loading: orgLoading } = useOrganization();
  const { isSuperadmin, loading: superadminLoading } = useSuperadmin();
  const [data, setData] = useState<Omit<DashboardData, 'loading'>>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[useDashboardData] 🔍 Estado atual:', {
      orgLoading,
      superadminLoading,
      organizationId,
      isSuperadmin,
    });

    if (orgLoading || superadminLoading) {
      setLoading(true);
      return;
    }

    if (!organizationId) {
      console.warn('[useDashboardData] ⚠️ Sem organizationId');
      setData(EMPTY_DATA);
      setLoading(false);
      return;
    }

    let active = true;

    const fetchData = async () => {
      setLoading(true);
      console.log('[useDashboardData] 🚀 Iniciando carregamento de dados', {
        organizationId,
        isSuperadmin,
      });

      try {
        const [leadsRes, salesRes, productsRes, stagesRes, originsRes] = await Promise.all([
          supabase.from('leads').select('id, name, email, pipeline_stage, origin, created_at, updated_at').eq('organization_id', organizationId),
          supabase.from('sales').select('id, value, product_id, lead_id, created_at').eq('organization_id', organizationId),
          supabase.from('products').select('id, name').eq('organization_id', organizationId),
          supabase.from('pipeline_stages').select('id, name, sort_order').eq('organization_id', organizationId).eq('active', true).order('sort_order'),
          supabase.from('lead_origins').select('id, name').eq('organization_id', organizationId).eq('active', true),
        ]);

        const leads = leadsRes.data || [];
        const allSales = salesRes.data || [];
        const products = productsRes.data || [];
        const stages = stagesRes.data || [];
        const origins = originsRes.data || [];

        // Filter sales by dateRange if provided
        const sales = dateRange
          ? allSales.filter((s) => {
              const d = new Date(s.created_at || '');
              return d >= dateRange.start && d <= dateRange.end;
            })
          : allSales;

        console.log('[useDashboardData] 📊 Resultado leads:', { count: leads.length, error: leadsRes.error?.message || null });
        console.log('[useDashboardData] 📊 Resultado sales:', { count: sales.length, total: allSales.length, error: salesRes.error?.message || null });
        console.log('[useDashboardData] 📊 Resultado products:', { count: products.length, error: productsRes.error?.message || null });
        console.log('[useDashboardData] 📊 Resultado pipeline_stages:', { count: stages.length, error: stagesRes.error?.message || null });
        console.log('[useDashboardData] 📊 Resultado lead_origins:', { count: origins.length, error: originsRes.error?.message || null });

        const totalLeads = leads.length;
        const lastStage = stages.length > 0 ? stages[stages.length - 1] : null;
        const clients = lastStage ? leads.filter((l) => l.pipeline_stage === lastStage.id).length : 0;
        const conversionRate = totalLeads ? ((clients / totalLeads) * 100).toFixed(1) : '0';
        const totalRevenue = sales.reduce((sum, s) => sum + (s.value || 0), 0);
        const totalSales = sales.length;
        const ticketMedio = totalSales > 0 ? totalRevenue / totalSales : 0;

        // Recurring clients: leads with more than 1 sale
        const leadSalesCount: Record<string, number> = {};
        sales.forEach((s) => {
          leadSalesCount[s.lead_id] = (leadSalesCount[s.lead_id] || 0) + 1;
        });
        const recurringClients = Object.values(leadSalesCount).filter((c) => c > 1).length;

        // Top products by revenue
        const productRevenueMap: Record<string, { name: string; count: number; revenue: number }> = {};
        sales.forEach((s) => {
          if (!s.product_id) return;
          if (!productRevenueMap[s.product_id]) {
            const prod = products.find((p) => p.id === s.product_id);
            productRevenueMap[s.product_id] = { name: prod?.name || 'Sem nome', count: 0, revenue: 0 };
          }
          productRevenueMap[s.product_id].count += 1;
          productRevenueMap[s.product_id].revenue += s.value || 0;
        });
        const topProducts = Object.values(productRevenueMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        // Sales by day (within selected period or last 30 days)
        const periodStart = dateRange?.start || (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
        const salesByDayMap: Record<string, number> = {};
        sales.forEach((s) => {
          const d = new Date(s.created_at || '');
          if (d >= periodStart) {
            const key = d.toLocaleDateString('pt-BR');
            salesByDayMap[key] = (salesByDayMap[key] || 0) + (s.value || 0);
          }
        });
        const salesByDay = Object.entries(salesByDayMap).map(([day, value]) => ({ day, value }));

        const leadsByStage = stages.map((s) => ({
          name: s.name.length > 12 ? `${s.name.slice(0, 12)}…` : s.name,
          value: leads.filter((l) => l.pipeline_stage === s.id).length,
        }));

        const leadsByOrigin = origins
          .map((o) => ({
            name: o.name.length > 15 ? `${o.name.slice(0, 15)}…` : o.name,
            value: leads.filter((l) => l.origin === o.name).length,
          }))
          .filter((x) => x.value > 0);

        const revenueByProduct = products
          .map((p) => ({
            name: p.name.length > 15 ? `${p.name.slice(0, 15)}…` : p.name,
            value: sales.filter((s) => s.product_id === p.id).reduce((sum, s) => sum + (s.value || 0), 0),
          }))
          .filter((x) => x.value > 0);

        // Stuck leads: leads >7 days without moving stage (based on updated_at)
        const STUCK_THRESHOLD_DAYS = 7;
        const now = new Date();
        const stuckLeads: StuckLead[] = leads
          .filter((l) => {
            if (!l.pipeline_stage || l.pipeline_stage === lastStage?.id) return false;
            const updatedAt = new Date(l.updated_at || l.created_at);
            const days = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
            return days >= STUCK_THRESHOLD_DAYS;
          })
          .map((l) => {
            const stageName = stages.find((s) => s.id === l.pipeline_stage)?.name || 'Desconhecido';
            const updatedAt = new Date(l.updated_at || l.created_at);
            const days = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
            return { id: l.id, name: l.name, email: l.email || '', stage: stageName, daysInStage: days };
          })
          .sort((a, b) => b.daysInStage - a.daysInStage)
          .slice(0, 10);

        // Stage metrics
        const stageMetrics: StageMetric[] = stages.map((s) => {
          const stageLeads = leads.filter((l) => l.pipeline_stage === s.id);
          const avgDays = stageLeads.length > 0
            ? stageLeads.reduce((sum, l) => {
                const created = new Date(l.updated_at || l.created_at);
                return sum + Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
              }, 0) / stageLeads.length
            : 0;
          return {
            name: s.name,
            leadCount: stageLeads.length,
            conversionRate: totalLeads > 0 ? (stageLeads.length / totalLeads) * 100 : 0,
            avgDaysInStage: Math.round(avgDays),
          };
        });

        if (isSuperadmin && totalLeads === 0 && sales.length === 0 && products.length === 0) {
          const [allLeadsRes, allSalesRes] = await Promise.all([
            supabase.from('leads').select('id', { head: true, count: 'exact' }),
            supabase.from('sales').select('id', { head: true, count: 'exact' }),
          ]);

          console.log('[useDashboardData] 🧪 Diagnóstico SuperAdmin (global):', {
            visibleLeadsGlobal: allLeadsRes.count ?? 0,
            visibleSalesGlobal: allSalesRes.count ?? 0,
            leadsError: allLeadsRes.error?.message || null,
            salesError: allSalesRes.error?.message || null,
          });
        }

        console.log('[useDashboardData] ✅ Dados calculados:', {
          totalLeads, clients, totalRevenue, totalSales, recurringClients, topProducts: topProducts.length, stuckLeads: stuckLeads.length,
        });

        if (!active) return;
        setData({ totalLeads, clients, conversionRate, totalRevenue, totalSales, recurringClients, ticketMedio, topProducts, salesByDay, leadsByStage, leadsByOrigin, revenueByProduct, stuckLeads, stageMetrics });
      } catch (err) {
        console.error('[useDashboardData] ❌ Erro:', err);
        if (active) setData(EMPTY_DATA);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [organizationId, orgLoading, isSuperadmin, superadminLoading, dateRange?.start?.getTime(), dateRange?.end?.getTime()]);

  return { ...data, loading };
}
