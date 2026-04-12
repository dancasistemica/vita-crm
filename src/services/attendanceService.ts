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

    // PASSO 1: Buscar clientes com acesso ao produto
    const { data, error } = await supabase
      .from('client_products')
      .select(`
        client_id,
        start_date,
        end_date,
        clients(
          id,
          name,
          email
        )
      `)
      .eq('product_id', productId)
      .eq('organization_id', organizationId);

    if (error) throw error;

    // PASSO 2: Filtrar apenas clientes com acesso ativo
    const today = new Date().toISOString().split('T')[0];
    const activeClients = (data || []).filter((cp: any) => {
      const startDate = cp.start_date;
      const endDate = cp.end_date;

      // Cliente ativo se: data >= start_date E (sem end_date OU data <= end_date)
      const isActive = startDate <= today && (!endDate || endDate >= today);

      if (!isActive) {
        console.log('[attendanceService] ⚠️ Cliente inativo:', {
          name: cp.clients?.name,
          startDate,
          endDate,
          today,
        });
      }

      return isActive;
    });

    const clients = activeClients.map((cp: any) => ({
      id: cp.client_id,
      name: cp.clients?.name || 'Cliente desconhecido',
      email: cp.clients?.email || '',
    }));

    console.log('[attendanceService] ✅ Clientes ativos encontrados:', clients.length);
    return clients;

  } catch (error) {
    console.error('[attendanceService] ❌ Erro ao buscar clientes:', error);
    throw error;
  }
};

export const fetchAttendanceWithPreviousData = async (
  organizationId: string,
  productId: string,
  classDate: string
) => {
  try {
    console.log('[attendanceService] Buscando presença anterior para:', {
      productId,
      classDate,
    });

    // PASSO 1: Buscar presença registrada para esta data
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

    // PASSO 2: Transformar em mapa para fácil lookup
    const attendanceMap = new Map();
    (data || []).forEach((att: any) => {
      attendanceMap.set(att.client_id, {
        id: att.id,
        attendance_type: att.attendance_type,
      });
    });

    console.log('[attendanceService] ✅ Presença anterior carregada:', attendanceMap.size, 'registros');
    return attendanceMap;

  } catch (error) {
    console.error('[attendanceService] ❌ Erro ao buscar presença anterior:', error);
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

// Buscar aulas da semana
export const fetchWeeklyClasses = async (
  organizationId: string,
  productId?: string
): Promise<Array<{
  id: string;
  product_id: string;
  product_name: string;
  class_date: string;
  class_time: string;
  description: string;
  day_of_week: string;
  attendance_count: number;
  total_clients: number;
}>> => {
  try {
    console.log('[attendanceService] Buscando aulas da semana');

    // PASSO 1: Calcular início e fim da semana (segunda a domingo)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    
    const weekStart = new Date(today.setDate(diff));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const startDateStr = weekStart.toISOString().split('T')[0];
    const endDateStr = weekEnd.toISOString().split('T')[0];

    console.log('[attendanceService] Período:', { startDateStr, endDateStr });

    // PASSO 2: Buscar sessões de aula da semana
    let query = supabase
      .from('class_sessions')
      .select(`
        id,
        product_id,
        class_date,
        description,
        products(id, name)
      `)
      .eq('organization_id', organizationId)
      .gte('class_date', startDateStr)
      .lte('class_date', endDateStr)
      .order('class_date', { ascending: true });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data: sessions, error: sessionsError } = await query;

    if (sessionsError) throw sessionsError;

    // PASSO 3: Para cada sessão, contar presença
    const classesWithData = await Promise.all(
      (sessions || []).map(async (session: any) => {
        const { data: attendances } = await supabase
          .from('class_attendance')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('product_id', session.product_id)
          .eq('class_date', session.class_date);

        const dayOfWeek = new Date(session.class_date + 'T00:00:00').toLocaleDateString('pt-BR', {
          weekday: 'long',
        });

        // Extrair horário da descrição (formato: "HH:MM - descrição")
        const timeMatch = session.description?.match(/^(\d{2}:\d{2})/);
        const classTime = timeMatch ? timeMatch[1] : '';
        const description = session.description?.replace(/^\d{2}:\d{2}\s*-\s*/, '') || '';

        return {
          id: session.id,
          product_id: session.product_id,
          product_name: session.products?.name || 'Produto desconhecido',
          class_date: session.class_date,
          class_time: classTime,
          description,
          day_of_week: dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1),
          attendance_count: attendances?.length || 0,
          total_clients: attendances?.length || 0,
        };
      })
    );

    console.log('[attendanceService] ✅ Aulas da semana encontradas:', classesWithData.length);
    return classesWithData;

  } catch (error) {
    console.error('[attendanceService] ❌ Erro ao buscar aulas da semana:', error);
    throw error;
  }
};