import { supabase } from '@/lib/supabase';

export interface ProductMetrics {
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
  churnRisk: number;
  weeklyData: Array<{
    week: string;
    newClients: number;
    activeClients: number;
    revenue: number;
  }>;
  engagementDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

export async function getProductMetrics(
  organizationId: string,
  productId: string
): Promise<ProductMetrics> {
  console.log('[productMetricsService] Calculando métricas:', productId);

  try {
    // Buscar dados de client_products
    const { data: clientProducts, error: cpError } = await supabase
      .from('client_products')
      .select(
        `
        id,
        payment_status,
        plan_type,
        start_date,
        clientes:client_id (
          id,
          engagement_level,
          last_attendance_date
        )
      `
      )
      .eq('organization_id', organizationId)
      .eq('product_id', productId);

    if (cpError) throw cpError;

    // Buscar informações do produto
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .single();

    if (pError) throw pError;

    // Buscar histórico de frequência
    const { data: attendance, error: aError } = await supabase
      .from('class_attendance')
      .select('client_id, class_date, attendance_type')
      .eq('product_id', productId)
      .gte('class_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (aError) throw aError;

    // Calcular métricas
    const totalClients = clientProducts?.length || 0;
    const activeClients = clientProducts?.filter((cp) => cp.payment_status === 'ATIVO').length || 0;
    const inactiveClients = totalClients - activeClients;
    const activePercentage = totalClients > 0 ? (activeClients / totalClients) * 100 : 0;

    // Calcular engajamento
    const engagementLevels = clientProducts?.map((cp: any) => cp.clientes?.engagement_level) || [];
    const engagementDistribution = {
      high: engagementLevels.filter((e) => e === 'ALTO').length,
      medium: engagementLevels.filter((e) => e === 'MÉDIO').length,
      low: engagementLevels.filter((e) => e === 'BAIXO').length,
    };

    // Calcular taxa de presença
    const totalAttendance = attendance?.length || 0;
    const presentAttendance = attendance?.filter((a) => a.attendance_type === 'PRESENTE' || a.attendance_type === 'PRESENÇA').length || 0;
    const attendanceRate = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0;

    // Calcular risco de churn (clientes sem acesso há 7+ dias)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const churnRiskCount = clientProducts?.filter((cp: any) => {
      const lastAccess = cp.clientes?.last_attendance_date;
      return !lastAccess || new Date(lastAccess) < sevenDaysAgo;
    }).length || 0;
    const churnRisk = totalClients > 0 ? (churnRiskCount / totalClients) * 100 : 0;

    // Dados semanais (últimas 4 semanas)
    const weeklyData = generateWeeklyData(clientProducts || [], attendance || []);

    // Receita (placeholder - integrar com Asaas depois)
    const totalRevenue = 0; // TODO: integrar com Asaas
    const monthlyRecurringRevenue = 0; // TODO: integrar com Asaas

    const averageEngagementLevel =
      engagementDistribution.high > engagementDistribution.low ? 'ALTO' : 'BAIXO';

    return {
      productId,
      productName: product?.name || 'Produto desconhecido',
      totalClients,
      activeClients,
      inactiveClients,
      activePercentage: Math.round(activePercentage * 10) / 10,
      totalRevenue,
      monthlyRecurringRevenue,
      averageEngagementLevel,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      churnRisk: Math.round(churnRisk * 10) / 10,
      weeklyData,
      engagementDistribution,
    };
  } catch (error) {
    console.error('[productMetricsService] Erro ao calcular métricas:', error);
    throw error;
  }
}

function generateWeeklyData(
  clientProducts: any[],
  attendance: any[]
): Array<{ week: string; newClients: number; activeClients: number; revenue: number }> {
  const weeks = [];
  const now = new Date();

  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

    const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;

    const newClientsInWeek = clientProducts.filter((cp) => {
      const startDate = cp.start_date ? new Date(cp.start_date) : null;
      return startDate && startDate >= weekStart && startDate < weekEnd;
    }).length;

    const activeInWeek = clientProducts.filter((cp) => cp.payment_status === 'ATIVO').length;

    weeks.push({
      week: weekLabel,
      newClients: newClientsInWeek,
      activeClients: activeInWeek,
      revenue: 0, // TODO: integrar com Asaas
    });
  }

  return weeks;
}

export async function getProductsMetricsOverview(
  organizationId: string
): Promise<Array<ProductMetrics>> {
  console.log('[productMetricsService] Calculando visão geral de produtos');

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name')
      .eq('organization_id', organizationId);

    if (error) throw error;

    const metricsPromises = (products || []).map((p) =>
      getProductMetrics(organizationId, p.id)
    );

    const allMetrics = await Promise.all(metricsPromises);
    return allMetrics;
  } catch (error) {
    console.error('[productMetricsService] Erro ao calcular visão geral:', error);
    throw error;
  }
}
