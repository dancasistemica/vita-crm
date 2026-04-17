import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export interface ClassCalendarData {
  id: string;
  product_id: string;
  product_name: string;
  class_date: string;
  description: string;
  class_time: string;
  attendance_count: number;
  total_clients: number;
  attendance_rate: number;
  created_at: string;
  status: 'registered' | 'pending' | 'future';
}

// Buscar aulas de um mês específico
export const fetchClassesByMonth = async (
  organizationId: string,
  productId: string,
  year: number,
  month: number
): Promise<ClassCalendarData[]> => {
  try {
    console.log('[classCalendarService] Buscando aulas do mês:', { year, month, productId });

    const baseDate = new Date(year, month - 1, 1);
    const startDate = format(startOfMonth(baseDate), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(baseDate), 'yyyy-MM-dd');

    // PASSO 1: Buscar sessões de aula do mês
    const { data: sessions, error: sessionsError } = await supabase
      .from('class_sessions')
      .select(`
        id,
        product_id,
        class_date,
        description,
        created_at,
        products(name)
      `)
      .eq('organization_id', organizationId)
      .eq('product_id', productId)
      .gte('class_date', startDate)
      .lte('class_date', endDate)
      .order('class_date', { ascending: true });

    if (sessionsError) throw sessionsError;

    // PASSO 2: Para cada sessão, contar presença
    const classesWithAttendance = await Promise.all(
      (sessions || []).map(async (session: any) => {
        const { data: attendances, error: attError } = await supabase
          .from('class_attendance')
          .select('id, attendance_type')
          .eq('organization_id', organizationId)
          .eq('product_id', productId)
          .eq('class_date', session.class_date);

        if (attError) throw attError;

        const presentCount = (attendances || []).filter(
          a => a.attendance_type === 'presente'
        ).length;
        const totalCount = attendances?.length || 0;

        // Determinar status
        const today = format(new Date(), 'yyyy-MM-dd');
        let status: 'registered' | 'pending' | 'future' = 'future';
        
        if (session.class_date < today) {
          if (totalCount > 0) {
            status = 'registered';
          } else {
            status = 'pending';
          }
        }

        // NOVO: Extrair horário da descrição
        const timeMatch = session.description?.match(/^(\d{2}:\d{2})/);
        const classTime = timeMatch ? timeMatch[1] : '';
        const cleanDescription = session.description?.replace(/^\d{2}:\d{2}\s*-\s*/, '') || '';

        return {
          id: session.id,
          product_id: session.product_id,
          product_name: session.products?.name || 'Produto desconhecido',
          class_date: session.class_date,
          class_time: classTime,
          description: cleanDescription,
          status,
          attendance_count: presentCount,
          total_clients: totalCount,
          attendance_rate: totalCount > 0 ? (presentCount / totalCount) * 100 : 0,
          created_at: session.created_at,
        };
      })
    );

    console.log('[classCalendarService] ✅ Aulas encontradas:', classesWithAttendance.length);
    return classesWithAttendance;

  } catch (error) {
    console.error('[classCalendarService] ❌ Erro ao buscar aulas:', error);
    throw error;
  }
};

// Buscar detalhes de uma aula específica
export const fetchClassDetail = async (
  organizationId: string,
  productId: string,
  classDate: string
) => {
  try {
    console.log('[classCalendarService] Buscando detalhes da aula:', classDate);

    // PASSO 1: Buscar sessão
    const { data: session, error: sessionError } = await supabase
      .from('class_sessions')
      .select(`
        *,
        products(name)
      `)
      .eq('organization_id', organizationId)
      .eq('product_id', productId)
      .eq('class_date', classDate)
      .maybeSingle();

    if (sessionError && sessionError.code !== 'PGRST116') throw sessionError;

    // PASSO 2: Buscar presenças registradas
    const { data: attendances, error: attError } = await supabase
      .from('class_attendance')
      .select(`
        id,
        client_id,
        attendance_type,
        clients(
          id,
          name,
          email
        )
      `)
      .eq('organization_id', organizationId)
      .eq('product_id', productId)
      .eq('class_date', classDate);

    if (attError) throw attError;

    // PASSO 3: Buscar todos os alunos ativos para este produto na data da aula
    // Isso garante que novas vendas apareçam na lista mesmo sem presença registrada
    const { data: enrolledClients, error: enrolledError } = await supabase
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
      .eq('organization_id', organizationId)
      .eq('product_id', productId);

    if (enrolledError) throw enrolledError;

    // Filtrar apenas ativos na data da aula
    const activeEnrolled = (enrolledClients || []).filter((cp: any) => {
      const isStarted = !cp.start_date || cp.start_date <= classDate;
      const isNotEnded = !cp.end_date || cp.end_date >= classDate;
      return isStarted && isNotEnded;
    });

    // PASSO 4: Mesclar as listas
    const attendanceMap = new Map();
    (attendances || []).forEach((att: any) => {
      attendanceMap.set(att.client_id, {
        id: att.id,
        client_id: att.client_id,
        client_name: att.clients?.name || 'Cliente desconhecido',
        client_email: att.clients?.email || '',
        attendance_type: att.attendance_type,
      });
    });

    // Adicionar alunos matriculados que ainda não têm registro de presença
    activeEnrolled.forEach((cp: any) => {
      if (!attendanceMap.has(cp.client_id)) {
        attendanceMap.set(cp.client_id, {
          id: `pending-${cp.client_id}`,
          client_id: cp.client_id,
          client_name: cp.clients?.name || 'Cliente desconhecido',
          client_email: cp.clients?.email || '',
          attendance_type: 'pendente', // Status padrão para quem não foi marcado
        });
      }
    });

    // Converter mapa para array e ordenar por nome
    const finalAttendances = Array.from(attendanceMap.values()).sort((a, b) => 
      a.client_name.localeCompare(b.client_name)
    );

    return {
      session,
      attendances: finalAttendances,
    };

  } catch (error) {
    console.error('[classCalendarService] ❌ Erro ao buscar detalhes:', error);
    throw error;
  }
};

// Buscar estatísticas do mês
export const fetchMonthStatistics = async (
  organizationId: string,
  productId: string,
  year: number,
  month: number
) => {
  try {
    const classes = await fetchClassesByMonth(organizationId, productId, year, month);

    const totalClasses = classes.length;
    const registeredClasses = classes.filter(c => c.status === 'registered').length;
    const pendingClasses = classes.filter(c => c.status === 'pending').length;
    const futureClasses = classes.filter(c => c.status === 'future').length;

    const totalAttendances = classes.reduce((sum, c) => sum + c.attendance_count, 0);
    const totalSlots = classes.reduce((sum, c) => sum + c.total_clients, 0);
    const averageAttendanceRate = totalSlots > 0 ? (totalAttendances / totalSlots) * 100 : 0;

    return {
      totalClasses,
      registeredClasses,
      pendingClasses,
      futureClasses,
      totalAttendances,
      totalSlots,
      averageAttendanceRate,
    };

  } catch (error) {
    console.error('[classCalendarService] ❌ Erro ao calcular estatísticas:', error);
    throw error;
  }
};
