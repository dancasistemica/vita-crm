import { supabase } from '@/lib/supabase';

interface AttendanceRecord {
  client_id: string;
  product_id: string;
  class_date: string;
  attendance_type: 'PRESENTE' | 'AUSENTE' | 'GRAVADA';
  recorded_by: string;
}

export async function getProductClients(
  organizationId: string,
  productId: string
) {
  console.log('[attendanceService] Buscando clientes do produto:', productId);

  try {
    const { data, error } = await supabase
      .from('client_products')
      .select(
        `
        id,
        client_id,
        clientes:client_id (
          id,
          name,
          email,
          phone
        )
      `
      )
      .eq('organization_id', organizationId)
      .eq('product_id', productId)
      .eq('payment_status', 'ATIVO');

    if (error) throw error;

    return (data || []).map((cp: any) => ({
      client_id: cp.client_id,
      client_name: cp.clientes?.name || 'Desconhecido',
      email: cp.clientes?.email || '',
      phone: cp.clientes?.phone || '',
    }));
  } catch (error) {
    console.error('[attendanceService] Erro ao buscar clientes:', error);
    throw error;
  }
}

export async function recordAttendance(
  organizationId: string,
  records: AttendanceRecord[]
) {
  console.log('[attendanceService] Registrando presença:', {
    count: records.length,
    date: records[0]?.class_date,
  });

  try {
    // Delete existing records for the same date and product to avoid duplicates
    // This allows re-submitting the form to update attendance
    if (records.length > 0) {
      const { error: deleteError } = await supabase
        .from('class_attendance')
        .delete()
        .eq('organization_id', organizationId)
        .eq('product_id', records[0].product_id)
        .eq('class_date', records[0].class_date);

      if (deleteError) throw deleteError;
    }

    const { data, error } = await supabase
      .from('class_attendance')
      .insert(
        records.map((r) => ({
          organization_id: organizationId,
          client_id: r.client_id,
          product_id: r.product_id,
          class_date: r.class_date,
          attendance_type: r.attendance_type,
          // recorded_by: r.recorded_by, // This column doesn't exist in my check above
          created_at: new Date().toISOString(),
        }))
      );

    if (error) throw error;

    console.log('[attendanceService] Presença registrada com sucesso');
    return data;
  } catch (error) {
    console.error('[attendanceService] Erro ao registrar presença:', error);
    throw error;
  }
}

export async function getAttendanceForDate(
  organizationId: string,
  productId: string,
  classDate: string
) {
  console.log('[attendanceService] Buscando presença para data:', classDate);

  try {
    const { data, error } = await supabase
      .from('class_attendance')
      .select('client_id, attendance_type')
      .eq('organization_id', organizationId)
      .eq('product_id', productId)
      .eq('class_date', classDate);

    if (error) throw error;

    const attendanceMap = new Map<string, string>();
    (data || []).forEach((record: any) => {
      attendanceMap.set(record.client_id, record.attendance_type);
    });

    return attendanceMap;
  } catch (error) {
    console.error('[attendanceService] Erro ao buscar presença:', error);
    throw error;
  }
}
