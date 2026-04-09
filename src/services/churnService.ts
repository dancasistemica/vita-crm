import { supabase } from '@/lib/supabase';
import { CHURN_RULES } from '@/lib/churnRules';

export interface ChurnAlert {
  id: string;
  client_id: string;
  client_name: string;
  product_id: string;
  product_name: string;
  risk_reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action_required: string;
  days_without_access: number;
  last_attendance_date: string | null;
  created_at: string;
  status: 'pending' | 'contacted' | 'resolved' | 'cancelled';
  contact_history: Array<{
    date: string;
    method: string;
    notes: string;
    contacted_by: string;
  }>;
}

export async function identifyChurnRisks(
  organizationId: string,
  productId?: string
): Promise<ChurnAlert[]> {
  console.log('[churnService] Identificando riscos de churn:', {
    organizationId,
    productId,
  });

  try {
    const alerts: ChurnAlert[] = [];
    const now = new Date();

    // Buscar clientes do produto
    let query = supabase
      .from('client_products')
      .select(
        `
        id,
        client_id,
        product_id,
        payment_status,
        end_date,
        clientes:client_id (
          id,
          name,
          last_attendance_date
        ),
        products:product_id (
          id,
          name
        )
      `
      )
      .eq('organization_id', organizationId);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data: clientProducts, error } = await query;

    if (error) throw error;

    // Analisar cada cliente
    for (const cp of clientProducts || []) {
      const client = cp.clientes as any;
      const product = cp.products as any;
      
      const lastAccess = client?.last_attendance_date
        ? new Date(client.last_attendance_date)
        : null;
      
      const daysWithoutAccess = lastAccess
        ? Math.floor((now.getTime() - lastAccess.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Regra 1: Sem acesso por 21+ dias (Critical)
      if (daysWithoutAccess >= 21) {
        alerts.push({
          id: `${cp.client_id}-no-access-21`,
          client_id: cp.client_id,
          client_name: client?.name || 'Desconhecido',
          product_id: cp.product_id,
          product_name: product?.name || 'Desconhecido',
          risk_reason: CHURN_RULES.NO_ACCESS_21_DAYS.name,
          severity: 'critical',
          action_required: CHURN_RULES.NO_ACCESS_21_DAYS.action,
          days_without_access: daysWithoutAccess,
          last_attendance_date: client?.last_attendance_date || null,
          created_at: new Date().toISOString(),
          status: 'pending',
          contact_history: [],
        });
      }
      // Regra 2: Sem acesso por 14+ dias (High)
      else if (daysWithoutAccess >= 14) {
        alerts.push({
          id: `${cp.client_id}-no-access-14`,
          client_id: cp.client_id,
          client_name: client?.name || 'Desconhecido',
          product_id: cp.product_id,
          product_name: product?.name || 'Desconhecido',
          risk_reason: CHURN_RULES.NO_ACCESS_14_DAYS.name,
          severity: 'high',
          action_required: CHURN_RULES.NO_ACCESS_14_DAYS.action,
          days_without_access: daysWithoutAccess,
          last_attendance_date: client?.last_attendance_date || null,
          created_at: new Date().toISOString(),
          status: 'pending',
          contact_history: [],
        });
      }
      // Regra 3: Sem acesso por 7+ dias (Medium)
      else if (daysWithoutAccess >= 7) {
        alerts.push({
          id: `${cp.client_id}-no-access-7`,
          client_id: cp.client_id,
          client_name: client?.name || 'Desconhecido',
          product_id: cp.product_id,
          product_name: product?.name || 'Desconhecido',
          risk_reason: CHURN_RULES.NO_ACCESS_7_DAYS.name,
          severity: 'medium',
          action_required: CHURN_RULES.NO_ACCESS_7_DAYS.action,
          days_without_access: daysWithoutAccess,
          last_attendance_date: client?.last_attendance_date || null,
          created_at: new Date().toISOString(),
          status: 'pending',
          contact_history: [],
        });
      }

      // Regra 4: Vigência vencida
      if (cp.end_date) {
        const endDate = new Date(cp.end_date);
        if (endDate < now) {
          alerts.push({
            id: `${cp.client_id}-expired`,
            client_id: cp.client_id,
            client_name: client?.name || 'Desconhecido',
            product_id: cp.product_id,
            product_name: product?.name || 'Desconhecido',
            risk_reason: CHURN_RULES.EXPIRED_MEMBERSHIP.name,
            severity: CHURN_RULES.EXPIRED_MEMBERSHIP.severity,
            action_required: CHURN_RULES.EXPIRED_MEMBERSHIP.action,
            days_without_access: daysWithoutAccess,
            last_attendance_date: client?.last_attendance_date || null,
            created_at: new Date().toISOString(),
            status: 'pending',
            contact_history: [],
          });
        }
      }

      // Regra 5: Pagamento pendente
      if (cp.payment_status === 'late' || cp.payment_status === 'pending_payment') {
         alerts.push({
          id: `${cp.client_id}-payment-late`,
          client_id: cp.client_id,
          client_name: client?.name || 'Desconhecido',
          product_id: cp.product_id,
          product_name: product?.name || 'Desconhecido',
          risk_reason: CHURN_RULES.OVERDUE_PAYMENT.name,
          severity: CHURN_RULES.OVERDUE_PAYMENT.severity,
          action_required: CHURN_RULES.OVERDUE_PAYMENT.action,
          days_without_access: daysWithoutAccess,
          last_attendance_date: client?.last_attendance_date || null,
          created_at: new Date().toISOString(),
          status: 'pending',
          contact_history: [],
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error('[churnService] Erro ao identificar riscos:', error);
    throw error;
  }
}

export async function updateAlertStatus(
  alertId: string,
  status: ChurnAlert['status'],
  note?: string,
  method?: string
): Promise<void> {
  // Como não temos tabela de churn_alerts, vamos simular ou usar metadata/tags se existissem
  // Por enquanto, apenas logamos, pois a persistência exigiria uma migração
  console.log('[churnService] Atualizando status do alerta:', { alertId, status, note, method });
}
