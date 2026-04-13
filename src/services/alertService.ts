import { supabase } from '@/integrations/supabase/client';

export interface ClientAlert {
  id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  product_id: string;
  product_name: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high';
  status: 'active' | 'resolved';
  
  // Dados da falta real
  real_absences: number; // Ausente E não assistiu gravação
  consecutive_real_absences: number;
  last_real_absence_date: string;
  
  // Contexto
  total_classes: number;
  attended_live: number;
  watched_recorded: number;
  total_absences: number; // Ausente (ao vivo ou gravação)
  
  // Ação
  created_at: string;
  resolved_at?: string;
  action_taken?: string;
}

// Calcular FALTA REAL = ausente ao vivo E não assistiu gravação
export const calculateRealAbsences = async (
  organizationId: string,
  clientId: string,
  days: number = 30
): Promise<{
  real_absences: number;
  consecutive_real_absences: number;
  last_real_absence_date: string;
  absences_detail: Array<{
    class_date: string;
    is_real_absence: boolean; // true = ausente + não gravada
    attendance_type: string;
  }>;
}> => {
  try {
    console.log('[alertService] Calculando faltas reais para cliente:', clientId);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Buscar TODAS as aulas do período para os produtos que o cliente tem
    const { data: clientProducts } = await supabase
      .from('client_products')
      .select('product_id')
      .eq('client_id', clientId)
      .eq('organization_id', organizationId);

    const productIds = clientProducts?.map(cp => cp.product_id) || [];

    if (productIds.length === 0) {
      return {
        real_absences: 0,
        consecutive_real_absences: 0,
        last_real_absence_date: '',
        absences_detail: [],
      };
    }

    const { data: allClasses } = await supabase
      .from('class_sessions')
      .select('class_date, product_id')
      .in('product_id', productIds)
      .eq('organization_id', organizationId)
      .gte('class_date', startDateStr)
      .order('class_date', { ascending: false });

    // Buscar presença/ausência do cliente
    const { data: attendances } = await supabase
      .from('class_attendance')
      .select('class_date, attendance_type, product_id')
      .eq('organization_id', organizationId)
      .eq('client_id', clientId)
      .gte('class_date', startDateStr)
      .order('class_date', { ascending: false });

    console.log('[alertService] Aulas totais:', allClasses?.length || 0);
    console.log('[alertService] Registros de presença:', attendances?.length || 0);

    // Mapear aulas e presença por data e produto para lidar com múltiplos produtos se necessário
    // Mas geralmente o alerta é por contexto. Vamos simplificar por data.
    const attendanceMap = new Map();
    attendances?.forEach(att => {
      attendanceMap.set(`${att.class_date}-${att.product_id}`, att.attendance_type);
    });

    // Calcular faltas reais
    const absencesDetail: Array<{
      class_date: string;
      is_real_absence: boolean;
      attendance_type: string;
    }> = [];

    let realAbsences = 0;
    let consecutiveRealAbsences = 0;
    let lastRealAbsenceDate = '';
    let currentConsecutive = 0;

    allClasses?.forEach(cls => {
      const attendanceType = attendanceMap.get(`${cls.class_date}-${cls.product_id}`);

      // FALTA REAL = ausente E não assistiu gravação (ou sem registro)
      const isRealAbsence = attendanceType === 'ausente' || !attendanceType;

      if (isRealAbsence) {
        realAbsences++;
        currentConsecutive++;
        if (!lastRealAbsenceDate) {
          lastRealAbsenceDate = cls.class_date;
        }
      } else {
        // Se já tínhamos uma sequência, ela foi interrompida
        if (currentConsecutive > consecutiveRealAbsences) {
          consecutiveRealAbsences = currentConsecutive;
        }
        currentConsecutive = 0;
      }

      absencesDetail.push({
        class_date: cls.class_date,
        is_real_absence: isRealAbsence,
        attendance_type: attendanceType || 'não registrado',
      });
    });

    // Final check for consecutive
    if (currentConsecutive > consecutiveRealAbsences) {
      consecutiveRealAbsences = currentConsecutive;
    }

    console.log('[alertService] ✅ Faltas reais calculadas:', {
      realAbsences,
      consecutiveRealAbsences,
      lastRealAbsenceDate,
    });

    return {
      real_absences: realAbsences,
      consecutive_real_absences: consecutiveRealAbsences,
      last_real_absence_date: lastRealAbsenceDate,
      absences_detail: absencesDetail,
    };

  } catch (error) {
    console.error('[alertService] ❌ Erro ao calcular faltas reais:', error);
    throw error;
  }
};

// Gerar alertas para clientes com 3+ faltas reais consecutivas
export const generateAlertsForProduct = async (
  organizationId: string,
  productId: string,
  days: number = 30
): Promise<ClientAlert[]> => {
  try {
    console.log('[alertService] Gerando alertas para produto:', productId);

    // Buscar dados do produto
    const { data: productData } = await supabase
      .from('products')
      .select('name')
      .eq('id', productId)
      .single();

    const productName = productData?.name || 'Produto desconhecido';

    // Buscar todos os clientes do produto
    const { data: clients } = await supabase
      .from('client_products')
      .select('client_id, clients(id, name, email)')
      .eq('product_id', productId)
      .eq('organization_id', organizationId);

    if (!clients || clients.length === 0) {
      console.log('[alertService] ℹ️ Nenhum cliente encontrado');
      return [];
    }

    const alerts: ClientAlert[] = [];

    for (const cp of clients) {
      const clientId = cp.client_id;
      const clientName = (cp.clients as any)?.name || 'Cliente desconhecido';
      const clientEmail = (cp.clients as any)?.email || '';

      console.log(`[alertService] Analisando cliente: ${clientName}`);

      // Calcular faltas reais
      const realAbsencesResult = await calculateRealAbsences(
        organizationId,
        clientId,
        days
      );

      // ALERTA: 3+ faltas reais consecutivas
      if (realAbsencesResult.consecutive_real_absences >= 3) {
        console.log(`[alertService] 🚨 ALERTA: ${clientName} com ${realAbsencesResult.consecutive_real_absences} faltas consecutivas`);

        // Buscar dados de presença para o contexto
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];

        const { data: attendances } = await supabase
          .from('class_attendance')
          .select('attendance_type')
          .eq('organization_id', organizationId)
          .eq('client_id', clientId)
          .eq('product_id', productId)
          .gte('class_date', startDateStr);

        const attended = attendances?.filter(a => a.attendance_type === 'presente').length || 0;
        const recorded = attendances?.filter(a => a.attendance_type === 'gravada').length || 0;
        const total = attendances?.length || 0;

        // Determinar severidade
        let severity: 'low' | 'medium' | 'high' = 'low';
        if (realAbsencesResult.consecutive_real_absences >= 5) {
          severity = 'high';
        } else if (realAbsencesResult.consecutive_real_absences >= 4) {
          severity = 'medium';
        }

        const alert: ClientAlert = {
          id: `${clientId}-${Date.now()}`,
          client_id: clientId,
          client_name: clientName,
          client_email: clientEmail,
          product_id: productId,
          product_name: productName,
          alert_type: 'consecutive_absences',
          severity,
          real_absences: realAbsencesResult.real_absences,
          consecutive_real_absences: realAbsencesResult.consecutive_real_absences,
          last_real_absence_date: realAbsencesResult.last_real_absence_date,
          total_classes: realAbsencesResult.absences_detail.length,
          attended_live: attended,
          watched_recorded: recorded,
          total_absences: realAbsencesResult.real_absences,
          status: 'active',
          created_at: new Date().toISOString(),
        };

        alerts.push(alert);
      }
    }

    console.log('[alertService] ✅ Alertas gerados:', alerts.length);
    return alerts;

  } catch (error) {
    console.error('[alertService] ❌ Erro ao gerar alertas:', error);
    throw error;
  }
};

// Resolver alerta (marcar como resolvido)
export const resolveAlert = async (
  alertId: string,
  actionTaken: string
): Promise<void> => {
  try {
    console.log('[alertService] Resolvendo alerta:', alertId);
    console.log('[alertService] Ação tomada:', actionTaken);

    // Por enquanto, apenas log, mas futuramente poderia salvar numa tabela 'alerts'
    // Se o usuário quiser persistência real, precisaríamos de uma migração.
    
    console.log('[alertService] ✅ Alerta resolvido');
  } catch (error) {
    console.error('[alertService] ❌ Erro ao resolver alerta:', error);
    throw error;
  }
};
