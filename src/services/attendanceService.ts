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

// Buscar clientes de um produto (Lógica robusta: Vendas + Mensalidades)
export const fetchClientsByProduct = async (
  organizationId: string,
  productId: string,
  classDate?: string
) => {
  try {
    console.log('[AttendanceRegisterPage] 📋 Carregando alunos para o produto:', productId);
    
    // BUSCA 1: Vendas únicas para o produto
    console.log('[AttendanceRegisterPage] 🔍 PASSO 1: Buscando vendas únicas...');
    const { data: uniqueSales, error: salesError } = await supabase
      .from('sales')
      .select(`
        id,
        lead_id,
        product_id,
        status,
        clients:lead_id(id, name, email, phone)
      `)
      .eq('organization_id', organizationId)
      .eq('product_id', productId)
      .in('status', ['ativo', 'pago', 'finalizado']);

    if (salesError) {
      console.error('[AttendanceRegisterPage] ❌ Erro ao buscar sales:', salesError);
    } else {
      console.log('[AttendanceRegisterPage] ✅ Vendas únicas encontradas:', uniqueSales?.length || 0);
    }

    // BUSCA 2: Mensalidades para o produto
    console.log('[AttendanceRegisterPage] 🔍 PASSO 2: Buscando mensalidades...');
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        client_id,
        product_id,
        status,
        clients:client_id(id, name, email, phone)
      `)
      .eq('organization_id', organizationId)
      .eq('product_id', productId)
      .in('status', ['ativo', 'ativa', 'pago', 'regular']);

    if (subsError) {
      console.error('[AttendanceRegisterPage] ❌ Erro ao buscar subscriptions:', subsError);
    } else {
      console.log('[AttendanceRegisterPage] ✅ Mensalidades encontradas:', subscriptions?.length || 0);
    }


    // COMBINAR: Vendas + Mensalidades
    const allStudents = [
      ...(uniqueSales || []).map(sale => ({
        id: (sale.clients as any)?.id || sale.lead_id,
        name: (sale.clients as any)?.name || 'Cliente desconhecido',
        email: (sale.clients as any)?.email || '',
        phone: (sale.clients as any)?.phone || '',
        type: 'venda_unica',
        sale_id: sale.id,
      })),
      ...(subscriptions || []).map(sub => ({
        id: (sub.clients as any)?.id || sub.client_id,
        name: (sub.clients as any)?.name || 'Cliente desconhecido',
        email: (sub.clients as any)?.email || '',
        phone: (sub.clients as any)?.phone || '',
        type: 'mensalidade',
        subscription_id: sub.id,
      })),
    ];

    // REMOVER DUPLICATAS
    const uniqueStudents = Array.from(
      new Map(allStudents.map(student => [student.id, student])).values()
    );

    console.log('[attendanceService] ✅ Total de alunos únicos encontrados:', uniqueStudents.length);
    return uniqueStudents;

  } catch (error) {
    console.error('[attendanceService] ❌ Erro crítico ao buscar clientes:', error);
    throw error;
  }
};


export const getStudentsForClass = fetchClientsByProduct;


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
        client_data: att.clients, // Dados completos do cliente incluídos
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
  day_number: number;
  attendance_count: number;
  total_clients: number;
}>> => {
  try {
    console.log('[fetchWeeklyClasses] 🔍 INICIANDO BUSCA');
    console.log('[fetchWeeklyClasses] Parâmetros:', { organizationId, productId });

    // PASSO 1: Validar organizationId
    if (!organizationId) {
      console.error('[fetchWeeklyClasses] ❌ organizationId é obrigatório');
      throw new Error('organizationId é obrigatório');
    }

    // PASSO 2: Calcular período da semana (segunda a domingo)
    const today = new Date();
    console.log('[fetchWeeklyClasses] Data atual:', today.toISOString());

    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, etc
    console.log('[fetchWeeklyClasses] Dia da semana (0-6):', dayOfWeek);

    // Calcular segunda-feira da semana atual
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(today.getFullYear(), today.getMonth(), diff);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const startDateStr = weekStart.toISOString().split('T')[0];
    const endDateStr = weekEnd.toISOString().split('T')[0];

    console.log('[fetchWeeklyClasses] ✅ Período calculado:', {
      startDateStr,
      endDateStr,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
    });

    // PASSO 3: Construir query
    console.log('[fetchWeeklyClasses] 🔨 Construindo query ao Supabase');

    let query = supabase
      .from('class_sessions')
      .select(`
        id,
        product_id,
        class_date,
        description,
        created_at,
        products(
          id,
          name
        )
      `)
      .eq('organization_id', organizationId)
      .gte('class_date', startDateStr)
      .lte('class_date', endDateStr)
      .order('class_date', { ascending: true });

    console.log('[fetchWeeklyClasses] Query base construída');

    // PASSO 4: Aplicar filtro de produto se fornecido
    if (productId && productId !== '' && productId !== 'undefined') {
      console.log('[fetchWeeklyClasses] 🔍 Filtrando por produto:', productId);
      query = query.eq('product_id', productId);
    } else {
      console.log('[fetchWeeklyClasses] ℹ️ Sem filtro de produto (buscando todos)');
    }

    // PASSO 5: Executar query
    console.log('[fetchWeeklyClasses] 📡 Executando query ao Supabase...');
    const { data: sessions, error: sessionsError } = await query;

    if (sessionsError) {
      console.error('[fetchWeeklyClasses] ❌ Erro na query:', sessionsError);
      console.error('[fetchWeeklyClasses] Código do erro:', sessionsError.code);
      console.error('[fetchWeeklyClasses] Mensagem:', sessionsError.message);
      throw new Error(`Erro ao buscar aulas: ${sessionsError.message}`);
    }

    console.log('[fetchWeeklyClasses] ✅ Query executada com sucesso');
    console.log('[fetchWeeklyClasses] Sessões retornadas:', sessions?.length || 0);
    console.log('[fetchWeeklyClasses] Dados brutos:', sessions);

    if (!sessions || sessions.length === 0) {
      console.warn('[fetchWeeklyClasses] ⚠️ Nenhuma aula encontrada para o período');
      return [];
    }

    // PASSO 6: Processar cada sessão
    console.log('[fetchWeeklyClasses] 🔄 Processando sessões...');

    const classesWithData = await Promise.all(
      sessions.map(async (session: any, index: number) => {
        console.log(`[fetchWeeklyClasses] Processando sessão ${index + 1}/${sessions.length}:`, {
          id: session.id,
          product_id: session.product_id,
          class_date: session.class_date,
          product_name: session.products?.name,
        });

        // Buscar registros de presença para contar tipos
        const { data: attendances, error: attError } = await supabase
          .from('class_attendance')
          .select('attendance_type')
          .eq('organization_id', organizationId)
          .eq('product_id', session.product_id)
          .eq('class_date', session.class_date);

        if (attError) {
          console.error('[fetchWeeklyClasses] ❌ Erro ao buscar presença:', attError);
        }

        const attendanceList = attendances || [];
        const presenceCount = attendanceList.filter(a => 
          a.attendance_type?.toLowerCase() === 'presente' || 
          a.attendance_type?.toLowerCase() === 'presença'
        ).length;
        
        const absenceCount = attendanceList.filter(a => 
          a.attendance_type?.toLowerCase() === 'ausente' || 
          a.attendance_type?.toLowerCase() === 'falta'
        ).length;

        console.log(`[fetchWeeklyClasses] Estatísticas para ${session.class_date}:`, { presenceCount, absenceCount });

        // Extrair data/hora
        const classDateTime = new Date(session.class_date + 'T00:00:00');
        const dayName = classDateTime.toLocaleDateString('pt-BR', { weekday: 'long' });
        const dayNumber = classDateTime.getDate();

        // Extrair horário da descrição (formato: "HH:MM - descrição")
        const timeMatch = session.description?.match(/^(\d{2}:\d{2})/);
        const classTime = timeMatch ? timeMatch[1] : '';
        const description = session.description?.replace(/^\d{2}:\d{2}\s*-\s*/, '') || 'Aula';

        const processedClass = {
          id: session.id,
          product_id: session.product_id,
          product_name: session.products?.name || 'Produto desconhecido',
          class_date: session.class_date,
          class_time: classTime,
          description: description,
          day_of_week: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          day_number: dayNumber,
          attendance_count: presenceCount,
          total_clients: attendanceList.length,
          presence_count: presenceCount,
          absence_count: absenceCount,
        };

        console.log('[fetchWeeklyClasses] ✅ Sessão processada:', processedClass);
        return processedClass;
      })
    );

    console.log('[fetchWeeklyClasses] ✅ BUSCA CONCLUÍDA');
    console.log('[fetchWeeklyClasses] Total de aulas:', classesWithData.length);
    console.log('[fetchWeeklyClasses] Aulas:', classesWithData);

    return classesWithData;

  } catch (error) {
    console.error('[fetchWeeklyClasses] ❌ ERRO CRÍTICO:', error);
    if (error instanceof Error) {
      console.error('[fetchWeeklyClasses] Stack:', error.stack);
    }
    throw error;
  }
};