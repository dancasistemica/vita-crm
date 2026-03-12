import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface DashboardData {
  totalLeads: number;
  clients: number;
  conversionRate: string;
  totalRevenue: number;
  leadsByStage: { name: string; value: number }[];
  leadsByOrigin: { name: string; value: number }[];
  revenueByProduct: { name: string; value: number }[];
  loading: boolean;
}

export function useDashboardData(): DashboardData {
  const { organizationId, loading: orgLoading } = useOrganization();
  const [data, setData] = useState<Omit<DashboardData, 'loading'>>({
    totalLeads: 0,
    clients: 0,
    conversionRate: '0',
    totalRevenue: 0,
    leadsByStage: [],
    leadsByOrigin: [],
    revenueByProduct: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orgLoading || !organizationId) {
      setLoading(!orgLoading);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      console.log('[useDashboardData] Carregando dados para org:', organizationId);

      try {
        // Fetch leads, sales, products, pipeline_stages in parallel
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

        const totalLeads = leads.length;
        // Find the last stage as "client" stage
        const lastStage = stages.length > 0 ? stages[stages.length - 1] : null;
        const clients = lastStage ? leads.filter(l => l.pipeline_stage === lastStage.id).length : 0;
        const conversionRate = totalLeads ? ((clients / totalLeads) * 100).toFixed(1) : '0';
        const totalRevenue = sales.reduce((sum, s) => sum + (s.value || 0), 0);

        const leadsByStage = stages.map(s => ({
          name: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name,
          value: leads.filter(l => l.pipeline_stage === s.id).length,
        }));

        const leadsByOrigin = origins.map(o => ({
          name: o.name.length > 15 ? o.name.slice(0, 15) + '…' : o.name,
          value: leads.filter(l => l.origin === o.name).length,
        })).filter(x => x.value > 0);

        const revenueByProduct = products.map(p => ({
          name: p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name,
          value: sales.filter(s => s.product_id === p.id).reduce((sum, s) => sum + (s.value || 0), 0),
        })).filter(x => x.value > 0);

        console.log('[useDashboardData] ✅ Dados carregados:', { totalLeads, clients, totalRevenue });
        setData({ totalLeads, clients, conversionRate, totalRevenue, leadsByStage, leadsByOrigin, revenueByProduct });
      } catch (err) {
        console.error('[useDashboardData] Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId, orgLoading]);

  return { ...data, loading };
}
