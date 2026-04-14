import { supabase } from '@/lib/supabase';

export interface ProductOverview {
  productId: string;
  productName: string;
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  activePercentage: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageEngagementLevel: string;
  attendanceRate: number;
  churnRiskCount: number;
  churnRiskPercentage: number;
  newClientsThisMonth: number;
  clientsLostThisMonth: number;
}

export interface ExecutiveDashboardData {
  totalProducts: number;
  totalClients: number;
  totalActiveClients: number;
  totalRevenue: number;
  totalMRR: number;
  overallRetentionRate: number;
  overallChurnRisk: number;
  averageEngagement: string;
  products: ProductOverview[];
  topPerformingProduct: ProductOverview | null;
  lowestPerformingProduct: ProductOverview | null;
  highestChurnRiskProduct: ProductOverview | null;
  trends: {
    newClientsThisMonth: number;
    clientsLostThisMonth: number;
    revenueGrowth: number;
  };
}

export async function getExecutiveDashboardData(
  organizationId: string
): Promise<ExecutiveDashboardData> {
  const isConsolidated = organizationId === 'consolidado';
  console.log('[executiveDashboardService] Calculando dashboard executivo:', organizationId, 'consolidado:', isConsolidated);

  try {
    // Buscar todos os produtos da organização
    let productsQuery = supabase
      .from('products')
      .select('id, name');
    
    if (!isConsolidated) {
      productsQuery = productsQuery.eq('organization_id', organizationId);
    }

    const { data: products, error: productsError } = await productsQuery;

    if (productsError) throw productsError;

    // Buscar dados de clientes por produto
    let cpQuery = supabase
      .from('client_products')
      .select(
        `
        id,
        product_id,
        payment_status,
        start_date,
        end_date,
        clientes:clients (
          id,
          name,
          engagement_level,
          last_attendance_date
        )
      `
      );
    
    if (!isConsolidated) {
      cpQuery = cpQuery.eq('organization_id', organizationId);
    }

    const { data: clientProducts, error: cpError } = await cpQuery;

    if (cpError) throw cpError;

    // Calcular métricas por produto
    const productMetrics = new Map<string, ProductOverview>();

    for (const product of products || []) {
      const productClients = (clientProducts || []).filter(
        (cp) => cp.product_id === product.id
      );

      const totalClients = productClients.length;
      const activeClients = productClients.filter(
        (cp) => cp.payment_status === 'ATIVO'
      ).length;
      const inactiveClients = totalClients - activeClients;
      const activePercentage = totalClients > 0 ? (activeClients / totalClients) * 100 : 0;

      // Calcular risco de churn
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const churnRiskCount = productClients.filter((cp) => {
        // @ts-ignore - Handle the nested relationship accurately based on client data
        const lastAccess = cp.clientes?.last_attendance_date;
        return !lastAccess || new Date(lastAccess) < sevenDaysAgo;
      }).length;
      const churnRiskPercentage = totalClients > 0 ? (churnRiskCount / totalClients) * 100 : 0;

      // Calcular engajamento médio
      // @ts-ignore
      const engagementLevels = productClients.map((cp) => cp.clientes?.engagement_level);
      const highCount = engagementLevels.filter((e) => e === 'ALTO').length;
      const mediumCount = engagementLevels.filter((e) => e === 'MÉDIO').length;
      const lowCount = engagementLevels.filter((e) => e === 'BAIXO').length;
      const averageEngagement = highCount > lowCount ? 'ALTO' : 'BAIXO';

      // Calcular taxa de presença (placeholder - integrar com class_attendance depois)
      const attendanceRate = 75; // TODO: calcular de verdade

      // Métricas financeiras (placeholder - integrar com Asaas depois)
      const totalRevenue = 0; // TODO: integrar com Asaas
      const monthlyRecurringRevenue = 0; // TODO: integrar com Asaas

      // Novos clientes e perdidos este mês
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const newClientsThisMonth = productClients.filter((cp) => {
        const startDate = new Date(cp.start_date);
        return startDate >= thisMonth;
      }).length;
      const clientsLostThisMonth = 0; // TODO: calcular de verdade

      productMetrics.set(product.id, {
        productId: product.id,
        productName: product.name,
        totalClients,
        activeClients,
        inactiveClients,
        activePercentage: Math.round(activePercentage * 10) / 10,
        totalRevenue,
        monthlyRecurringRevenue,
        averageEngagementLevel: averageEngagement,
        attendanceRate,
        churnRiskCount,
        churnRiskPercentage: Math.round(churnRiskPercentage * 10) / 10,
        newClientsThisMonth,
        clientsLostThisMonth,
      });
    }

    // Consolidar dados
    const productArray = Array.from(productMetrics.values());

    const totalClients = productArray.reduce((sum, p) => sum + p.totalClients, 0);
    const totalActiveClients = productArray.reduce((sum, p) => sum + p.activeClients, 0);
    const totalRevenue = productArray.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalMRR = productArray.reduce((sum, p) => sum + p.monthlyRecurringRevenue, 0);
    const overallRetentionRate =
      totalClients > 0 ? Math.round((totalActiveClients / totalClients) * 1000) / 10 : 0;
    const totalChurnRisk = productArray.reduce((sum, p) => sum + p.churnRiskCount, 0);
    const overallChurnRisk =
      totalClients > 0 ? Math.round((totalChurnRisk / totalClients) * 1000) / 10 : 0;

    // Encontrar produtos de destaque
    const topPerforming = productArray.sort((a, b) => b.activePercentage - a.activePercentage)[0];
    const lowestPerforming = productArray.sort((a, b) => a.activePercentage - b.activePercentage)[0];
    const highestChurnRisk = productArray.sort((a, b) => b.churnRiskPercentage - a.churnRiskPercentage)[0];

    const newClientsThisMonth = productArray.reduce((sum, p) => sum + p.newClientsThisMonth, 0);
    const clientsLostThisMonth = productArray.reduce((sum, p) => sum + p.clientsLostThisMonth, 0);

    return {
      totalProducts: products?.length || 0,
      totalClients,
      totalActiveClients,
      totalRevenue,
      totalMRR,
      overallRetentionRate,
      overallChurnRisk,
      averageEngagement: topPerforming?.averageEngagementLevel || 'MÉDIO',
      products: productArray,
      topPerformingProduct: topPerforming || null,
      lowestPerformingProduct: lowestPerforming || null,
      highestChurnRiskProduct: highestChurnRisk || null,
      trends: {
        newClientsThisMonth,
        clientsLostThisMonth,
        revenueGrowth: 0, // TODO: calcular mês anterior
      },
    };
  } catch (error) {
    console.error('[executiveDashboardService] Erro ao calcular dashboard:', error);
    throw error;
  }
}

export async function getProductTrendData(
  organizationId: string,
  days: number = 30
): Promise<
  Array<{
    date: string;
    totalClients: number;
    activeClients: number;
    newClients: number;
  }>
> {
  console.log('[executiveDashboardService] Buscando dados de tendência:', days);

  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    let query = supabase
      .from('client_products')
      .select('start_date, payment_status')
      .gte('start_date', startDate);
    
    if (organizationId !== 'consolidado') {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Agrupar por data
    const trendMap = new Map<string, { total: number; active: number; new: number }>();

    (data || []).forEach((record: any) => {
      const date = record.start_date.split('T')[0];
      const current = trendMap.get(date) || { total: 0, active: 0, new: 0 };

      current.total++;
      if (record.payment_status === 'ATIVO') current.active++;
      current.new++;

      trendMap.set(date, current);
    });

    // Converter para array ordenado
    return Array.from(trendMap.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, counts]) => ({
        date,
        totalClients: counts.total,
        activeClients: counts.active,
        newClients: counts.new,
      }));
  } catch (error) {
    console.error('[executiveDashboardService] Erro ao buscar dados de tendência:', error);
    throw error;
  }
}
