import { supabase } from '@/integrations/supabase/client';

export interface AttendanceMetrics {
  client_id: string;
  client_name: string;
  total_classes: number;
  present_count: number;
  recorded_count: number;
  absent_count: number;
  
  // Taxas
  presence_rate: number; // (presente + gravada) / total
  live_rate: number; // presente / total
  absence_rate: number; // ausente / total
  engagement_rate: number; // (presente + gravada) / total
  
  // Risco
  risk_level: 'low' | 'medium' | 'high';
  last_engagement_date: string;
  consecutive_absences: number;
  trend: 'improving' | 'stable' | 'declining';
}

export const calculateClientMetrics = async (
  organizationId: string,
  clientId: string,
  days: number = 30 // Últimos 30 dias
): Promise<AttendanceMetrics> => {
  try {
    console.log('[reportService] Calculando métricas para cliente:', clientId);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Buscar todas as presenças do cliente
    let attendancesQuery = supabase
      .from('class_attendance')
      .select('attendance_type, class_date')
      .eq('client_id', clientId)
      .gte('class_date', startDateStr);
    
    if (organizationId !== 'consolidado') {
      attendancesQuery = attendancesQuery.eq('organization_id', organizationId);
    }

    const { data: attendances } = await attendancesQuery.order('class_date', { ascending: false });

    // Buscar nome do cliente
    const { data: client } = await supabase
      .from('clients')
      .select('name')
      .eq('id', clientId)
      .single();

    const total = attendances?.length || 0;
    const present = attendances?.filter(a => a.attendance_type === 'presente').length || 0;
    const recorded = attendances?.filter(a => a.attendance_type === 'gravada').length || 0;
    const absent = attendances?.filter(a => a.attendance_type === 'ausente').length || 0;

    // Calcular consecutivas ausências (CRÍTICO para churn)
    let consecutiveAbsences = 0;
    if (attendances && attendances.length > 0) {
      for (const att of attendances) {
        if (att.attendance_type === 'ausente') {
          consecutiveAbsences++;
        } else {
          break; // Parou a sequência
        }
      }
    }

    // Determinar nível de risco
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (total > 0) {
      if (absent === total) {
        riskLevel = 'high'; // 100% ausente
      } else if (consecutiveAbsences >= 3) {
        riskLevel = 'high'; // 3+ faltas consecutivas
      } else if (absent / total > 0.5) {
        riskLevel = 'medium'; // Mais de 50% ausente
      } else if (absent / total > 0.3) {
        riskLevel = 'medium'; // Mais de 30% ausente
      }
    }

    // Determinar tendência
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (total >= 4) {
      const recentHalf = Math.ceil(total / 2);
      const recentAttendances = attendances?.slice(0, recentHalf) || [];
      const olderAttendances = attendances?.slice(recentHalf) || [];

      const recentAbsent = recentAttendances.filter(a => a.attendance_type === 'ausente').length;
      const olderAbsent = olderAttendances.filter(a => a.attendance_type === 'ausente').length;

      const recentRate = (recentAttendances.length - recentAbsent) / recentAttendances.length;
      const olderRate = (olderAttendances.length - olderAbsent) / olderAttendances.length;

      if (recentRate > olderRate + 0.1) {
        trend = 'improving';
      } else if (recentRate < olderRate - 0.1) {
        trend = 'declining';
      }
    }

    return {
      client_id: clientId,
      client_name: client?.name || 'Cliente desconhecido',
      total_classes: total,
      present_count: present,
      recorded_count: recorded,
      absent_count: absent,
      presence_rate: total > 0 ? ((present + recorded) / total) * 100 : 0,
      live_rate: total > 0 ? (present / total) * 100 : 0,
      absence_rate: total > 0 ? (absent / total) * 100 : 0,
      engagement_rate: total > 0 ? ((present + recorded) / total) * 100 : 0,
      risk_level: riskLevel,
      last_engagement_date: attendances?.find(a => a.attendance_type !== 'ausente')?.class_date || '',
      consecutive_absences: consecutiveAbsences,
      trend,
    };
  } catch (error) {
    console.error('[reportService] Erro ao calcular métricas:', error);
    throw error;
  }
};

export const getClientsAtRisk = async (
  organizationId: string,
  productId: string,
  days: number = 30
): Promise<AttendanceMetrics[]> => {
  try {
    console.log('[reportService] Buscando clientes em risco para produto:', productId);

    // Buscar todos os clientes do produto
    let cpQuery = supabase
      .from('client_products')
      .select('client_id')
      .eq('product_id', productId);
    
    if (organizationId !== 'consolidado') {
      cpQuery = cpQuery.eq('organization_id', organizationId);
    }

    const { data: clientProducts, error } = await cpQuery;

    if (error) throw error;
    if (!clientProducts || clientProducts.length === 0) {
      return [];
    }

    // Calcular métricas para cada cliente
    const metrics = await Promise.all(
      clientProducts.map(cp => calculateClientMetrics(organizationId, cp.client_id, days))
    );

    // Filtrar apenas clientes em risco (medium ou high)
    const atRisk = metrics.filter(m => m.risk_level !== 'low');

    // Ordenar por risco (high primeiro)
    return atRisk.sort((a, b) => {
      if (a.risk_level === 'high' && b.risk_level !== 'high') return -1;
      if (a.risk_level !== 'high' && b.risk_level === 'high') return 1;
      return b.consecutive_absences - a.consecutive_absences;
    });
  } catch (error) {
    console.error('[reportService] Erro ao buscar clientes em risco:', error);
    throw error;
  }
};
