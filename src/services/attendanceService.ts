import { supabase } from '@/integrations/supabase/client';

export interface AttendanceRecord {
  id: string;
  organization_id: string;
  client_id: string;
  product_id: string;
  class_date: string;
  attendance_type: 'presente' | 'ausente' | 'gravada';
  created_at: string;
  client_name?: string;
  client_email?: string;
}

export interface AttendanceFormData {
  product_id: string;
  class_date: string;
  class_description?: string;
  attendances: Array<{
    client_id: string;
    attendance_type: 'presente' | 'ausente' | 'gravada';
  }>;
}

// Buscar clientes de um produto
export const fetchClientsByProduct = async (
  organizationId: string,
  productId: string
) => {
  try {
    console.log('[attendanceService] Buscando clientes do produto:', productId);

    const { data, error } = await supabase
      .from('client_products')
      .select(`
        client_id,
        clients(
          id,
          name,
          email
        )
      `)
      .eq('product_id', productId)
      .eq('organization_id', organizationId);

    if (error) throw error;

    const clients = (data || []).map((cp: any) => ({
      id: cp.client_id,
      name: cp.clients?.name || 'Cliente desconhecido',
      email: cp.clients?.email || '',
    }));

    console.log('[attendanceService] ✅ Clientes encontrados:', clients.length);
    return clients;

  } catch (error) {
    console.error('[attendanceService] ❌ Erro ao buscar clientes:', error);
    throw error;
  }
};

// Buscar produtos da organização
export const fetchProductsForOrganization = async (organizationId: string) => {
  try {
    console.log('[attendanceService] Buscando produtos da organização');

    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) throw error;

    console.log('[attendanceService] ✅ Produtos encontrados:', data?.length || 0);
    return data || [];

  } catch (error) {
    console.error('[attendanceService] ❌ Erro ao buscar produtos:', error);
    throw error;
  }
};

// Buscar presença registrada para uma data específica
export const fetchAttendanceByDate = async (
  organizationId: string,
  productId: string,
  classDate: string
) => {
  try {
    console.log('[attendanceService] Buscando presença para:', {
      productId,
      classDate,
    });

    const { data, error } = await supabase
      .from('class_attendance')
      .select(`
        id,
        client_id,
        attendance_type,
        created_at,
        clients(
          id,
          name,
          email
        )
      `)
      .eq('organization_id', organizationId)
      .eq('product_id', productId)
      .eq('class_date', classDate);

    if (error) throw error;

    const attendances = (data || []).map((att: any) => ({
      id: att.id,
      client_id: att.client_id,
      client_name: att.clients?.name || 'Cliente desconhecido',
      client_email: att.clients?.email || '',
      attendance_type: att.attendance_type as 'presente' | 'ausente' | 'gravada',
      created_at: att.created_at,
    }));

    console.log('[attendanceService] ✅ Registros encontrados:', attendances.length);
    return attendances;

  } catch (error) {
    console.error('[attendanceService] ❌ Erro ao buscar presença:', error);
    throw error;
  }
};

// Salvar/atualizar presença
export const saveAttendance = async (
  organizationId: string,
  productId: string,
  classDate: string,
  attendances: Array<{
    client_id: string;
    attendance_type: 'presente' | 'ausente' | 'gravada';
  }>
) => {
  try {
    console.log('[attendanceService] Salvando presença:', {
      productId,
      classDate,
      totalClients: attendances.length,
    });

    // PASSO 1: Deletar registros antigos para esta data/produto
    const { error: deleteError } = await supabase
      .from('class_attendance')
      .delete()
      .eq('organization_id', organizationId)
      .eq('product_id', productId)
      .eq('class_date', classDate);

    if (deleteError) {
      console.error('[attendanceService] ❌ Erro ao deletar registros antigos:', deleteError);
      throw deleteError;
    }

    // PASSO 2: Inserir novos registros
    const recordsToInsert = attendances.map(att => ({
      organization_id: organizationId,
      client_id: att.client_id,
      product_id: productId,
      class_date: classDate,
      attendance_type: att.attendance_type,
    }));

    if (recordsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('class_attendance')
        .insert(recordsToInsert);

      if (insertError) {
        console.error('[attendanceService] ❌ Erro ao inserir presença:', insertError);
        throw insertError;
      }
    }

    console.log('[attendanceService] ✅ Presença salva com sucesso');
    return true;

  } catch (error) {
    console.error('[attendanceService] ❌ Erro ao salvar presença:', error);
    throw error;
  }
};

// Atualizar um único registro de presença
export const updateSingleAttendance = async (
  attendanceId: string,
  attendanceType: 'presente' | 'ausente' | 'gravada'
) => {
  try {
    console.log('[attendanceService] Atualizando presença:', {
      attendanceId,
      attendanceType,
    });

    const { error } = await supabase
      .from('class_attendance')
      .update({ attendance_type: attendanceType })
      .eq('id', attendanceId);

    if (error) throw error;

    console.log('[attendanceService] ✅ Presença atualizada');
    return true;

  } catch (error) {
    console.error('[attendanceService] ❌ Erro ao atualizar presença:', error);
    throw error;
  }
};
