import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization, CONSOLIDATED_ORG_ID } from '@/contexts/OrganizationContext';
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

export interface ConsolidatedData {
  totalOrganizations: number;
  topOrganizations: { id: string; name: string; leads: number; revenue: number; conversionRate: number }[];
}

export interface ProductInsightsData {
  topProducts: { name: string; sales: number; revenue: number; percentOfTotal: number }[];
  conversionBenchmark: {
    overallRate: number;
    byStage: { stage: string; rate: number; leadsCount: number; isBottleneck: boolean }[];
    orgsAboveAverage: number;
    orgsBelowAverage: number;
  };
  funnelAnalysis: {
    totalLeads: number;
    byStage: { stage: string; leads: number; converted: number; conversionRate: number; avgDaysInStage: number; abandonmentRate: number }[];
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
  isConsolidated: boolean;
  consolidatedData: ConsolidatedData | null;
}

interface DashboardReturn extends DashboardData {
  productInsights: ProductInsightsData | null;
}

const EMPTY_DATA: Omit<DashboardData, 'loading' | 'isConsolidated' | 'consolidatedData'> & { productInsights: null } = {
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
  productInsights: null,
};

export function useDashboardData(dateRange?: { start: Date; end: Date }): DashboardReturn {
  const { organizationId, loading: orgLoading } = useOrganization();
  const { isSuperadmin, loading: superadminLoading } = useSuperadmin();
  const [data, setData] = useState<Omit<DashboardData, 'loading' | 'isConsolidated' | 'consolidatedData'>>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedData | null>(null);
  const [productInsights, setProductInsights] = useState<ProductInsightsData | null>(null);

  const isConsolidated = organizationId === CONSOLIDATED_ORG_ID;

  useEffect(() => {
    console.log('[useDashboardData] 🔍 Estado atual:', {
      orgLoading,
      superadminLoading,
      organizationId,
      isSuperadmin,
      isConsolidated: organizationId === CONSOLIDATED_ORG_ID,
    });

    if (orgLoading || superadminLoading) {
      setLoading(true);
      return;
    }

    if (!organizationId) {
      console.warn('[useDashboardData] ⚠️ Sem organizationId');
      setData(EMPTY_DATA);
      setConsolidatedData(null);
      setLoading(false);
      return;
    }

    let active = true;

    const fetchData = async () => {
      setLoading(true);
      const consolidated = organizationId === CONSOLIDATED_ORG_ID;
      console.log('[useDashboardData] 🚀 Iniciando carregamento', {
        organizationId,
        isSuperadmin,
        mode: consolidated ? 'CONSOLIDADO' : 'ORGANIZAÇÃO',
      });

      try {
        // Build queries: consolidated mode queries ALL data (superadmin RLS allows it)
        const leadsQ = consolidated
          ? supabase.from('leads').select('id, name, email, pipeline_stage, origin, created_at, updated_at, organization_id')
          : supabase.from('leads').select('id, name, email, pipeline_stage, origin, created_at, updated_at, organization_id').eq('organization_id', organizationId);

        const salesQ = consolidated
          ? supabase.from('sales').select('id, value, product_id, lead_id, created_at, organization_id')
          : supabase.from('sales').select('id, value, product_id, lead_id, created_at, organization_id').eq('organization_id', organizationId);

        const productsQ = consolidated
          ? supabase.from('products').select('id, name, organization_id')
          : supabase.from('products').select('id, name, organization_id').eq('organization_id', organizationId);

        const stagesQ = consolidated
          ? supabase.from('pipeline_stages').select('id, name, sort_order, organization_id').eq('active', true).order('sort_order')
          : supabase.from('pipeline_stages').select('id, name, sort_order, organization_id').eq('active', true).eq('organization_id', organizationId).order('sort_order');

        const originsQ = consolidated
          ? supabase.from('lead_origins').select('id, name, organization_id').eq('active', true)
          : supabase.from('lead_origins').select('id, name, organization_id').eq('active', true).eq('organization_id', organizationId);

        const basePromises = [leadsQ, salesQ, productsQ, stagesQ, originsQ] as const;

        let orgsData: { id: string; name: string }[] = [];

        const [leadsRes, salesRes, productsRes, stagesRes, originsRes] = await Promise.all(basePromises);

        if (consolidated) {
          const orgsRes = await supabase.from('organizations').select('id, name').order('name');
          orgsData = orgsRes.data || [];
        }

        const allLeads = leadsRes.data || [];
        const allSales = salesRes.data || [];
        const products = productsRes.data || [];
        const stages = stagesRes.data || [];
        const origins = originsRes.data || [];

        // Filter by dateRange
        const leads = dateRange
          ? allLeads.filter((l: any) => {
              const d = new Date(l.created_at || '');
              return d >= dateRange.start && d <= dateRange.end;
            })
          : allLeads;

        const sales = dateRange
          ? allSales.filter((s: any) => {
              const d = new Date(s.created_at || '');
              return d >= dateRange.start && d <= dateRange.end;
            })
          : allSales;

        console.log('[useDashboardData] 📊 Resultado:', {
          leads: leads.length,
          sales: sales.length,
          products: products.length,
          stages: stages.length,
          mode: consolidated ? 'CONSOLIDADO' : 'ORG',
        });

        const totalLeads = leads.length;

        // For consolidated, use stages from all orgs; for single org, use org stages
        // "Client" stage = last stage per org
        let clients = 0;
        if (consolidated) {
          // Group stages by org, find last stage per org, count leads in those stages
          const orgStageMap = new Map<string, typeof stages>();
          stages.forEach((s: any) => {
            const arr = orgStageMap.get(s.organization_id) || [];
            arr.push(s);
            orgStageMap.set(s.organization_id, arr);
          });
          const lastStageIds = new Set<string>();
          orgStageMap.forEach((orgStages) => {
            const sorted = orgStages.sort((a: any, b: any) => a.sort_order - b.sort_order);
            if (sorted.length > 0) lastStageIds.add(sorted[sorted.length - 1].id);
          });
          clients = leads.filter((l: any) => lastStageIds.has(l.pipeline_stage)).length;
        } else {
          const lastStage = stages.length > 0 ? stages[stages.length - 1] : null;
          clients = lastStage ? leads.filter((l: any) => l.pipeline_stage === lastStage.id).length : 0;
        }

        const conversionRate = totalLeads ? ((clients / totalLeads) * 100).toFixed(1) : '0';
        const totalRevenue = sales.reduce((sum: number, s: any) => sum + (s.value || 0), 0);
        const totalSalesCount = sales.length;
        const ticketMedio = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;

        // Recurring clients
        const leadSalesCount: Record<string, number> = {};
        sales.forEach((s: any) => {
          leadSalesCount[s.lead_id] = (leadSalesCount[s.lead_id] || 0) + 1;
        });
        const recurringClients = Object.values(leadSalesCount).filter((c) => c > 1).length;

        // Top products
        const productRevenueMap: Record<string, { name: string; count: number; revenue: number }> = {};
        sales.forEach((s: any) => {
          if (!s.product_id) return;
          if (!productRevenueMap[s.product_id]) {
            const prod = products.find((p: any) => p.id === s.product_id);
            productRevenueMap[s.product_id] = { name: prod?.name || 'Sem nome', count: 0, revenue: 0 };
          }
          productRevenueMap[s.product_id].count += 1;
          productRevenueMap[s.product_id].revenue += s.value || 0;
        });
        const topProducts = Object.values(productRevenueMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        // Sales by day
        const periodStart = dateRange?.start || (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
        const salesByDayMap: Record<string, number> = {};
        sales.forEach((s: any) => {
          const d = new Date(s.created_at || '');
          if (d >= periodStart) {
            const key = d.toLocaleDateString('pt-BR');
            salesByDayMap[key] = (salesByDayMap[key] || 0) + (s.value || 0);
          }
        });
        const salesByDay = Object.entries(salesByDayMap).map(([day, value]) => ({ day, value }));

        // For consolidated, aggregate stages across all orgs by name
        let leadsByStage: { name: string; value: number }[];
        if (consolidated) {
          const stageNameMap = new Map<string, Set<string>>();
          stages.forEach((s: any) => {
            if (!stageNameMap.has(s.name)) stageNameMap.set(s.name, new Set());
            stageNameMap.get(s.name)!.add(s.id);
          });
          leadsByStage = Array.from(stageNameMap.entries()).map(([name, ids]) => ({
            name: name.length > 12 ? `${name.slice(0, 12)}…` : name,
            value: leads.filter((l: any) => ids.has(l.pipeline_stage)).length,
          }));
        } else {
          leadsByStage = stages.map((s: any) => ({
            name: s.name.length > 12 ? `${s.name.slice(0, 12)}…` : s.name,
            value: leads.filter((l: any) => l.pipeline_stage === s.id).length,
          }));
        }

        // Leads by origin — deduplicate origin names for consolidated
        const uniqueOriginNames = [...new Set(origins.map((o: any) => o.name))];
        const leadsByOrigin = uniqueOriginNames
          .map((name: string) => ({
            name: name.length > 15 ? `${name.slice(0, 15)}…` : name,
            value: leads.filter((l: any) => l.origin === name).length,
          }))
          .filter((x) => x.value > 0);

        // Revenue by product — deduplicate product names
        const uniqueProductNames = [...new Set(products.map((p: any) => p.name))];
        const revenueByProduct = uniqueProductNames
          .map((name: string) => {
            const productIds = products.filter((p: any) => p.name === name).map((p: any) => p.id);
            return {
              name: name.length > 15 ? `${name.slice(0, 15)}…` : name,
              value: sales.filter((s: any) => productIds.includes(s.product_id)).reduce((sum: number, s: any) => sum + (s.value || 0), 0),
            };
          })
          .filter((x) => x.value > 0);

        // Stuck leads
        const STUCK_THRESHOLD_DAYS = 7;
        const now = new Date();
        // Gather last stage IDs
        const allLastStageIds = new Set<string>();
        if (consolidated) {
          const orgStageMap = new Map<string, any[]>();
          stages.forEach((s: any) => {
            const arr = orgStageMap.get(s.organization_id) || [];
            arr.push(s);
            orgStageMap.set(s.organization_id, arr);
          });
          orgStageMap.forEach((orgStages) => {
            const sorted = orgStages.sort((a: any, b: any) => a.sort_order - b.sort_order);
            if (sorted.length > 0) allLastStageIds.add(sorted[sorted.length - 1].id);
          });
        } else {
          const lastStage = stages.length > 0 ? stages[stages.length - 1] : null;
          if (lastStage) allLastStageIds.add(lastStage.id);
        }

        const stuckLeads: StuckLead[] = leads
          .filter((l: any) => {
            if (!l.pipeline_stage || allLastStageIds.has(l.pipeline_stage)) return false;
            const updatedAt = new Date(l.updated_at || l.created_at);
            const days = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
            return days >= STUCK_THRESHOLD_DAYS;
          })
          .map((l: any) => {
            const stageName = stages.find((s: any) => s.id === l.pipeline_stage)?.name || 'Desconhecido';
            const updatedAt = new Date(l.updated_at || l.created_at);
            const days = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
            return { id: l.id, name: l.name, email: l.email || '', stage: stageName, daysInStage: days };
          })
          .sort((a, b) => b.daysInStage - a.daysInStage)
          .slice(0, 10);

        // Stage metrics
        let stageMetrics: StageMetric[];
        if (consolidated) {
          const stageNameMap = new Map<string, Set<string>>();
          stages.forEach((s: any) => {
            if (!stageNameMap.has(s.name)) stageNameMap.set(s.name, new Set());
            stageNameMap.get(s.name)!.add(s.id);
          });
          stageMetrics = Array.from(stageNameMap.entries()).map(([name, ids]) => {
            const stageLeads = leads.filter((l: any) => ids.has(l.pipeline_stage));
            const avgDays = stageLeads.length > 0
              ? stageLeads.reduce((sum: number, l: any) => {
                  const diffMs = now.getTime() - new Date(l.created_at).getTime();
                  return sum + diffMs / (1000 * 60 * 60 * 24);
                }, 0) / stageLeads.length
              : 0;
            return {
              name,
              leadCount: stageLeads.length,
              conversionRate: totalLeads > 0 ? (stageLeads.length / totalLeads) * 100 : 0,
              avgDaysInStage: Math.max(0, Math.round(avgDays)),
            };
          });
        } else {
          stageMetrics = stages.map((s: any) => {
            const stageLeads = leads.filter((l: any) => l.pipeline_stage === s.id);
            const avgDays = stageLeads.length > 0
              ? stageLeads.reduce((sum: number, l: any) => {
                  const diffMs = now.getTime() - new Date(l.created_at).getTime();
                  return sum + diffMs / (1000 * 60 * 60 * 24);
                }, 0) / stageLeads.length
              : 0;
            return {
              name: s.name,
              leadCount: stageLeads.length,
              conversionRate: totalLeads > 0 ? (stageLeads.length / totalLeads) * 100 : 0,
              avgDaysInStage: Math.max(0, Math.round(avgDays)),
            };
          });
        }

        // Consolidated extra data
        let consolidatedExtra: ConsolidatedData | null = null;
        if (consolidated) {
          const topOrgs = orgsData.map((org) => {
            const orgLeads = leads.filter((l: any) => l.organization_id === org.id);
            const orgSales = sales.filter((s: any) => s.organization_id === org.id);
            const orgRevenue = orgSales.reduce((sum: number, s: any) => sum + (s.value || 0), 0);
            // Find last stage for this org
            const orgStages = stages.filter((s: any) => s.organization_id === org.id).sort((a: any, b: any) => a.sort_order - b.sort_order);
            const lastStageId = orgStages.length > 0 ? orgStages[orgStages.length - 1].id : null;
            const orgClients = lastStageId ? orgLeads.filter((l: any) => l.pipeline_stage === lastStageId).length : 0;
            const rate = orgLeads.length > 0 ? (orgClients / orgLeads.length) * 100 : 0;
            return { id: org.id, name: org.name, leads: orgLeads.length, revenue: orgRevenue, conversionRate: rate };
          }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

          consolidatedExtra = {
            totalOrganizations: orgsData.length,
            topOrganizations: topOrgs,
          };
        }

        console.log('[useDashboardData] ✅ Dados calculados:', {
          totalLeads, clients, totalRevenue, totalSales: totalSalesCount, mode: consolidated ? 'CONSOLIDADO' : 'ORG',
        });

        if (!active) return;
        setData({ totalLeads, clients, conversionRate, totalRevenue, totalSales: totalSalesCount, recurringClients, ticketMedio, topProducts, salesByDay, leadsByStage, leadsByOrigin, revenueByProduct, stuckLeads, stageMetrics });
        setConsolidatedData(consolidatedExtra);
      } catch (err) {
        console.error('[useDashboardData] ❌ Erro:', err);
        if (active) {
          setData(EMPTY_DATA);
          setConsolidatedData(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [organizationId, orgLoading, isSuperadmin, superadminLoading, dateRange?.start?.getTime(), dateRange?.end?.getTime()]);

  return { ...data, loading, isConsolidated, consolidatedData };
}
