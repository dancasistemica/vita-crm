import { supabase } from "@/lib/supabase";

export interface DashboardMetrics {
  // Vendas
  sales: {
    total_sales: number;
    total_revenue: number;
    completed_sales: number;
    pending_sales: number;
    overdue_sales: number;
    conversion_rate: number;
    average_ticket: number;
    sales_trend: 'up' | 'down' | 'stable';
    sales_trend_percentage: number;
  };
  
  // Presença
  attendance: {
    total_classes: number;
    total_students: number;
    average_attendance_rate: number;
    students_at_risk: number;
    students_with_high_engagement: number;
    attendance_trend: 'up' | 'down' | 'stable';
    attendance_trend_percentage: number;
  };
  
  // Alertas
  alerts: {
    total_active_alerts: number;
    high_severity_alerts: number;
    medium_severity_alerts: number;
    low_severity_alerts: number;
    alerts_resolved_today: number;
  };
  
  // Integrações
  integrations: {
    total_integrations: number;
    connected_integrations: number;
    disconnected_integrations: number;
    last_sync_time: string;
    sync_status: 'success' | 'pending' | 'error';
  };
  
  // Período
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
}

export const calculateDashboardMetrics = async (
  organizationId: string,
  _productId?: string,
  days: number = 30
): Promise<DashboardMetrics> => {
  try {
    const isConsolidated = organizationId === 'consolidado';
    console.log(`[dashboardService] Calculando métricas do dashboard (org: ${organizationId}, consolidado: ${isConsolidated})`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = new Date().toISOString().split('T')[0];

    // Helper function for organization filtering
    const applyOrgFilter = (query: any) => {
      if (isConsolidated) return query;
      return query.eq('organization_id', organizationId);
    };

    // VENDAS
    console.log('[dashboardService] Calculando vendas...');
    let salesQuery = supabase
      .from('sales')
      .select('value, status, payment_status')
      .gte('created_at', startDate.toISOString());
    
    salesQuery = applyOrgFilter(salesQuery);
    const { data: sales, error: salesError } = await salesQuery;

    if (salesError) {
      console.error('[dashboardService] Erro ao buscar vendas:', salesError);
    }

    // MENSALIDADES (Subscription Payments)
    console.log('[dashboardService] Calculando mensalidades...');
    let subPaymentsQuery = supabase
      .from('subscription_payments')
      .select('amount, status')
      .gte('created_at', startDate.toISOString());
    
    subPaymentsQuery = applyOrgFilter(subPaymentsQuery);
    const { data: subPayments, error: subError } = await subPaymentsQuery;

    if (subError) {
      console.error('[dashboardService] Erro ao buscar mensalidades:', subError);
    }

    const totalSales = (sales?.length || 0) + (subPayments?.length || 0);
    const salesRevenue = sales?.reduce((acc, s) => acc + (Number(s.value) || 0), 0) || 0;
    const subRevenue = subPayments?.reduce((acc, s) => acc + (Number(s.amount) || 0), 0) || 0;
    const totalRevenue = salesRevenue + subRevenue;

    const completedSales = (sales?.filter(s => ['completed', 'concluido', 'pago', 'ativo'].includes(s.status?.toLowerCase())).length || 0) +
                           (subPayments?.filter(s => ['pago', 'concluido'].includes(s.status?.toLowerCase())).length || 0);
    
    const pendingSales = (sales?.filter(s => ['pending', 'pendente'].includes(s.status?.toLowerCase())).length || 0) +
                         (subPayments?.filter(s => ['pendente'].includes(s.status?.toLowerCase())).length || 0);
    
    const overdueSales = (sales?.filter(s => ['overdue', 'atrasado'].includes(s.payment_status?.toUpperCase())).length || 0) +
                         (subPayments?.filter(s => ['atrasado'].includes(s.status?.toLowerCase())).length || 0);

    const conversionRate = totalSales > 0 ? (completedSales / totalSales) * 100 : 0;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // PRESENÇA
    console.log('[dashboardService] Calculando presença...');
    let classesQuery = supabase
      .from('class_sessions')
      .select('id')
      .gte('class_date', startDateStr);
    
    classesQuery = applyOrgFilter(classesQuery);
    const { data: classes } = await classesQuery;

    let attendancesQuery = supabase
      .from('class_attendance')
      .select('client_id, attendance_type')
      .gte('class_date', startDateStr);
    
    attendancesQuery = applyOrgFilter(attendancesQuery);
    const { data: attendances } = await attendancesQuery;

    const totalClasses = classes?.length || 0;
    const uniqueStudents = new Set(attendances?.map(a => a.client_id)).size;
    const presentCount = attendances?.filter(a => a.attendance_type === 'presente').length || 0;
    const recordedCount = attendances?.filter(a => a.attendance_type === 'gravada').length || 0;
    const totalAttendances = attendances?.length || 0;
    const averageAttendanceRate = totalAttendances > 0 
      ? ((presentCount + recordedCount) / totalAttendances) * 100 
      : 0;

    // ALERTAS
    console.log('[dashboardService] Calculando alertas...');
    let alertsQuery = supabase
      .from('alerts')
      .select('severity, status, created_at')
      .eq('status', 'active');
    
    alertsQuery = applyOrgFilter(alertsQuery);
    const { data: alerts } = await alertsQuery;

    const totalAlerts = alerts?.length || 0;
    const highSeverityAlerts = alerts?.filter(a => (a as any).severity === 'high').length || 0;
    const mediumSeverityAlerts = alerts?.filter(a => (a as any).severity === 'medium').length || 0;
    const lowSeverityAlerts = alerts?.filter(a => (a as any).severity === 'low').length || 0;

    let resolvedAlertsQuery = supabase
      .from('alerts')
      .select('id')
      .eq('status', 'resolved')
      .gte('resolved_at', endDateStr);
    
    resolvedAlertsQuery = applyOrgFilter(resolvedAlertsQuery);
    const { data: resolvedAlerts } = await resolvedAlertsQuery;

    const alertsResolvedToday = resolvedAlerts?.length || 0;

    // INTEGRAÇÕES
    console.log('[dashboardService] Calculando integrações...');
    let integrationsQuery = supabase
      .from('integrations')
      .select('id, status, sync_config');
    
    integrationsQuery = applyOrgFilter(integrationsQuery);
    const { data: integrations } = await integrationsQuery;

    const totalIntegrations = integrations?.length || 0;
    const connectedIntegrations = integrations?.filter(i => i.status === 'connected' || i.status === 'active').length || 0;
    const disconnectedIntegrations = totalIntegrations - connectedIntegrations;
    
    const lastSync = integrations
      ?.filter(i => (i as any).sync_config?.last_sync)
      .map(i => new Date((i as any).sync_config.last_sync).getTime())
      .sort((a, b) => b - a)[0];
    
    const lastSyncTime = lastSync ? new Date(lastSync).toLocaleString('pt-BR') : 'Nunca';

    // TENDÊNCIAS (comparar com período anterior)
    console.log('[dashboardService] Calculando tendências...');
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);
    
    let previousSalesQuery = supabase
      .from('sales')
      .select('value')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());
    
    previousSalesQuery = applyOrgFilter(previousSalesQuery);
    const { data: previousSales } = await previousSalesQuery;

    let previousSubPaymentsQuery = supabase
      .from('subscription_payments')
      .select('amount')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());
    
    previousSubPaymentsQuery = applyOrgFilter(previousSubPaymentsQuery);
    const { data: previousSubPayments } = await previousSubPaymentsQuery;

    const previousSalesRevenue = previousSales?.reduce((acc, s) => acc + (Number(s.value) || 0), 0) || 0;
    const previousSubRevenue = previousSubPayments?.reduce((acc, s) => acc + (Number(s.amount) || 0), 0) || 0;
    const previousRevenue = previousSalesRevenue + previousSubRevenue;
    const revenueTrend = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;
    const salesTrend = revenueTrend > 5 ? 'up' : revenueTrend < -5 ? 'down' : 'stable';

    let previousAttendancesQuery = supabase
      .from('class_attendance')
      .select('attendance_type')
      .gte('class_date', previousStartDate.toISOString().split('T')[0])
      .lt('class_date', startDateStr);
    
    previousAttendancesQuery = applyOrgFilter(previousAttendancesQuery);
    const { data: previousAttendances } = await previousAttendancesQuery;

    const previousPresent = previousAttendances?.filter(a => a.attendance_type === 'presente').length || 0;
    const previousRecorded = previousAttendances?.filter(a => a.attendance_type === 'gravada').length || 0;
    const previousTotal = previousAttendances?.length || 0;
    const previousRate = previousTotal > 0 ? ((previousPresent + previousRecorded) / previousTotal) * 100 : 0;
    const attendanceTrendPercentage = previousRate > 0 
      ? ((averageAttendanceRate - previousRate) / previousRate) * 100 
      : 0;
    const attendanceTrend = attendanceTrendPercentage > 5 ? 'up' : attendanceTrendPercentage < -5 ? 'down' : 'stable';

    console.log('[dashboardService] ✅ Métricas calculadas');

    return {
      sales: {
        total_sales: totalSales,
        total_revenue: totalRevenue,
        completed_sales: completedSales,
        pending_sales: pendingSales,
        overdue_sales: overdueSales,
        conversion_rate: conversionRate,
        average_ticket: averageTicket,
        sales_trend: salesTrend as 'up' | 'down' | 'stable',
        sales_trend_percentage: revenueTrend,
      },
      attendance: {
        total_classes: totalClasses,
        total_students: uniqueStudents,
        average_attendance_rate: averageAttendanceRate,
        students_at_risk: 0, 
        students_with_high_engagement: 0,
        attendance_trend: attendanceTrend as 'up' | 'down' | 'stable',
        attendance_trend_percentage: attendanceTrendPercentage,
      },
      alerts: {
        total_active_alerts: totalAlerts,
        high_severity_alerts: highSeverityAlerts,
        medium_severity_alerts: mediumSeverityAlerts,
        low_severity_alerts: lowSeverityAlerts,
        alerts_resolved_today: alertsResolvedToday,
      },
      integrations: {
        total_integrations: totalIntegrations,
        connected_integrations: connectedIntegrations,
        disconnected_integrations: disconnectedIntegrations,
        last_sync_time: lastSyncTime,
        sync_status: connectedIntegrations > 0 ? 'success' : 'pending',
      },
      period: {
        start_date: startDateStr,
        end_date: endDateStr,
        days,
      },
    };
  } catch (error) {
    console.error('[dashboardService] Erro ao calcular métricas:', error);
    throw error;
  }
};
