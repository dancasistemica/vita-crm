import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSuperadmin } from '@/hooks/useSuperadmin';

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

const SUPERADMIN_ORG_STORAGE_KEY = 'superadmin_current_org';

export function useDashboardData(): DashboardData {
  const { organizationId, loading: orgLoading } = useOrganization();
  const { isSuperadmin, loading: superadminLoading } = useSuperadmin();
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

  const effectiveOrgId = useMemo(() => {
    if (organizationId) return organizationId;
    if (isSuperadmin) return localStorage.getItem(SUPERADMIN_ORG_STORAGE_KEY);
    return null;
  }, [organizationId, isSuperadmin]);

  useEffect(() => {
    console.log('[useDashboardData] 1️⃣ useEffect disparado — orgLoading:', orgLoading, 'superadminLoading:', superadminLoading, 'effectiveOrgId:', effectiveOrgId, 'organizationId:', organizationId, 'isSuperadmin:', isSuperadmin);

    if (orgLoading || superadminLoading) {
      console.log('[useDashboardData] 2️⃣ Ainda carregando contextos, aguardando...');
      setLoading(true);
      return;
    }

    if (!effectiveOrgId) {
      console.warn('[useDashboardData] ⚠️ Nenhuma organização selecionada');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      console.log('[useDashboardData] 3️⃣ Buscando dados para org:', effectiveOrgId);

      const requests = [
        supabase.from('leads').select('id, pipeline_stage, origin').eq('organization_id', effectiveOrgId),
        supabase.from('sales').select('id, value, product_id').eq('organization_id', effectiveOrgId),
        supabase.from('products').select('id, name').eq('organization_id', effectiveOrgId),
        supabase
          .from('pipeline_stages')
          .select('id, name, sort_order')
          .eq('organization_id', effectiveOrgId)
          .eq('active', true)
          .order('sort_order'),
        supabase.from('lead_origins').select('id, name').eq('organization_id', effectiveOrgId).eq('active', true),
      ] as const;

      const [leadsResult, salesResult, productsResult, stagesResult, originsResult] = await Promise.allSettled(requests);

      const unwrapData = <T,>(result: PromiseSettledResult<{ data: T[] | null; error: unknown }>, label: string): T[] => {
        if (result.status === 'rejected') {
          console.error(`[useDashboardData] Falha na query ${label}:`, result.reason);
          return [];
        }

        if (result.value.error) {
          console.error(`[useDashboardData] Erro na query ${label}:`, result.value.error);
          return [];
        }

        return result.value.data || [];
      };

      try {
        const leads = unwrapData<{ id: string; pipeline_stage: string | null; origin: string | null }>(leadsResult, 'leads');
        const sales = unwrapData<{ id: string; value: number | null; product_id: string | null }>(salesResult, 'sales');
        const products = unwrapData<{ id: string; name: string }>(productsResult, 'products');
        const stages = unwrapData<{ id: string; name: string; sort_order: number }>(stagesResult, 'pipeline_stages');
        const origins = unwrapData<{ id: string; name: string }>(originsResult, 'lead_origins');

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

        setData({ totalLeads, clients, conversionRate, totalRevenue, leadsByStage, leadsByOrigin, revenueByProduct });
        console.log('[useDashboardData] ✅ Dados carregados:', { totalLeads, clients, totalRevenue });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [effectiveOrgId, orgLoading, superadminLoading]);

  return { ...data, loading };
}
