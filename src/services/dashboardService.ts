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
    console.log('[dashboardService] Calculando métricas do dashboard');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = new Date().toISOString().split('T')[0];

    // VENDAS
    console.log('[dashboardService] Calculando vendas...');
    const { data: sales } = await supabase
      .from('sales')
      .select('amount, status, payment_status')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString());

    const totalSales = sales?.length || 0;
    const totalRevenue = sales?.reduce((acc, s) => acc + (Number(s.amount) || 0), 0) || 0;
    const completedSales = sales?.filter(s => s.status === 'completed').length || 0;
    const pendingSales = sales?.filter(s => s.status === 'pending').length || 0;
    const overdueSales = sales?.filter(s => s.payment_status === 'OVERDUE').length || 0;
    const conversionRate = totalSales > 0 ? (completedSales / totalSales) * 100 : 0;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // PRESENÇA
    console.log('[dashboardService] Calculando presença...');
    const { data: classes } = await supabase
      .from('class_sessions')
      .select('id')
      .eq('organization_id', organizationId)
      .gte('class_date', startDateStr);

    const { data: attendances } = await supabase
      .from('class_attendance')
      .select('client_id, attendance_type')
      .eq('organization_id', organizationId)
      .gte('class_date', startDateStr);

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
    const { data: alerts } = await supabase
      .from('alerts')
      .select('severity, status, created_at')
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    const totalAlerts = alerts?.length || 0;
    const highSeverityAlerts = alerts?.filter(a => a.severity === 'high').length || 0;
    const mediumSeverityAlerts = alerts?.filter(a => a.severity === 'medium').length || 0;
    const lowSeverityAlerts = alerts?.filter(a => a.severity === 'low').length || 0;

    const { data: resolvedAlerts } = await supabase
      .from('alerts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('status', 'resolved')
      .gte('resolved_at', endDateStr);

    const alertsResolvedToday = resolvedAlerts?.length || 0;

    // INTEGRAÇÕES
    console.log('[dashboardService] Calculando integrações...');
    const { data: integrations } = await supabase
      .from('integrations')
      .select('id, status, sync_config')
      .eq('organization_id', organizationId);

    const totalIntegrations = integrations?.length || 0;
    const connectedIntegrations = integrations?.filter(i => i.status === 'connected').length || 0;
    const disconnectedIntegrations = totalIntegrations - connectedIntegrations;
    
    // @ts-ignore
    const lastSync = integrations
      // @ts-ignore
      ?.filter(i => i.sync_config?.last_sync)
      // @ts-ignore
      .map(i => new Date(i.sync_config.last_sync).getTime())
      .sort((a, b) => b - a)[0];
    
    const lastSyncTime = lastSync ? new Date(lastSync).toLocaleString('pt-BR') : 'Nunca';

    // TENDÊNCIAS (comparar com período anterior)
    console.log('[dashboardService] Calculando tendências...');
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - days);
    
    const { data: previousSales } = await supabase
      .from('sales')
      .select('amount')
      .eq('organization_id', organizationId)
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    const previousRevenue = previousSales?.reduce((acc, s) => acc + (Number(s.amount) || 0), 0) || 0;
    const revenueTrend = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;
    const salesTrend = revenueTrend > 5 ? 'up' : revenueTrend < -5 ? 'down' : 'stable';

    const { data: previousAttendances } = await supabase
      .from('class_attendance')
      .select('attendance_type')
      .eq('organization_id', organizationId)
      .gte('class_date', previousStartDate.toISOString().split('T')[0])
      .lt('class_date', startDateStr);

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
        sales_trend: salesTrend,
        sales_trend_percentage: revenueTrend,
      },
      attendance: {
        total_classes: totalClasses,
        total_students: uniqueStudents,
        average_attendance_rate: averageAttendanceRate,
        students_at_risk: 0, // Será calculado com dados de alertas
        students_with_high_engagement: 0, // Será calculado com dados de presença
        attendance_trend: attendanceTrend,
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
