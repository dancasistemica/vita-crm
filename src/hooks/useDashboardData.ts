import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSuperadmin } from '@/hooks/useSuperadmin';

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
};

export function useDashboardData(): DashboardData {
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
          supabase.from('leads').select('id, pipeline_stage, origin').eq('organization_id', organizationId),
          supabase.from('sales').select('id, value, product_id').eq('organization_id', organizationId),
          supabase.from('products').select('id, name').eq('organization_id', organizationId),
          supabase.from('pipeline_stages').select('id, name, sort_order').eq('organization_id', organizationId).eq('active', true).order('sort_order'),
          supabase.from('lead_origins').select('id, name').eq('organization_id', organizationId).eq('active', true),
        ]);

        const leads = leadsRes.data || [];
        const sales = salesRes.data || [];
        const products = productsRes.data || [];
        const stages = stagesRes.data || [];
        const origins = originsRes.data || [];

        console.log('[useDashboardData] 📊 Resultado leads:', { count: leads.length, error: leadsRes.error?.message || null });
        console.log('[useDashboardData] 📊 Resultado sales:', { count: sales.length, error: salesRes.error?.message || null });
        console.log('[useDashboardData] 📊 Resultado products:', { count: products.length, error: productsRes.error?.message || null });
        console.log('[useDashboardData] 📊 Resultado pipeline_stages:', { count: stages.length, error: stagesRes.error?.message || null });
        console.log('[useDashboardData] 📊 Resultado lead_origins:', { count: origins.length, error: originsRes.error?.message || null });

        const totalLeads = leads.length;
        const lastStage = stages.length > 0 ? stages[stages.length - 1] : null;
        const clients = lastStage ? leads.filter((l) => l.pipeline_stage === lastStage.id).length : 0;
        const conversionRate = totalLeads ? ((clients / totalLeads) * 100).toFixed(1) : '0';
        const totalRevenue = sales.reduce((sum, s) => sum + (s.value || 0), 0);

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
          totalLeads,
          clients,
          totalRevenue,
          stages: stages.length,
          origins: origins.length,
        });

        if (!active) return;
        setData({ totalLeads, clients, conversionRate, totalRevenue, leadsByStage, leadsByOrigin, revenueByProduct });
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
  }, [organizationId, orgLoading, isSuperadmin, superadminLoading]);

  return { ...data, loading };
}
