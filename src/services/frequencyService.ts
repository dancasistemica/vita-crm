import { supabase } from '@/lib/supabase';

export interface AttendanceRecord {
  class_date: string;
  attendance_type: string;
  product_id: string;
  product_name: string;
}

export interface FrequencyStats {
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  recordedCount: number;
  attendanceRate: number;
  lastAttendance: string | null;
  currentStreak: number;
}

export async function getClientAttendanceHistory(
  clientId: string,
  productId?: string,
  monthYear?: { month: number; year: number }
): Promise<AttendanceRecord[]> {
  console.log('[frequencyService] Buscando histórico de presença:', {
    clientId,
    productId,
    monthYear,
  });

  let query = supabase
    .from('class_attendance')
    .select(
      `
      class_date,
      attendance_type,
      product_id,
      products:product_id (name)
    `
    )
    .eq('client_id', clientId)
    .order('class_date', { ascending: false });

  if (productId) {
    query = query.eq('product_id', productId);
  }

  if (monthYear) {
    const startDate = new Date(monthYear.year, monthYear.month - 1, 1)
      .toISOString()
      .split('T')[0];
    const endDate = new Date(monthYear.year, monthYear.month, 0)
      .toISOString()
      .split('T')[0];

    query = query
      .gte('class_date', startDate)
      .lte('class_date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[frequencyService] Erro ao buscar histórico:', error);
    throw error;
  }

  return (data || []).map((record: any) => ({
    class_date: record.class_date,
    attendance_type: record.attendance_type,
    product_id: record.product_id,
    product_name: record.products?.name || 'Produto desconhecido',
  }));
}

export async function getFrequencyStats(
  clientId: string,
  productId?: string,
  lastDays: number = 90
): Promise<FrequencyStats> {
  console.log('[frequencyService] Calculando estatísticas de frequência:', {
    clientId,
    productId,
    lastDays,
  });

  const startDate = new Date(Date.now() - lastDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  let query = supabase
    .from('class_attendance')
    .select('class_date, attendance_type')
    .eq('client_id', clientId)
    .gte('class_date', startDate)
    .order('class_date', { ascending: false });

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[frequencyService] Erro ao calcular estatísticas:', error);
    throw error;
  }

  const records = data || [];
  const totalClasses = records.length;
  // Handle both possible variants: PRESENTE/AUSENTE and PRESENÇA/FALTA
  const presentCount = records.filter((r) => r.attendance_type === 'PRESENTE' || r.attendance_type === 'PRESENÇA').length;
  const absentCount = records.filter((r) => r.attendance_type === 'AUSENTE' || r.attendance_type === 'FALTA').length;
  const recordedCount = records.filter((r) => r.attendance_type === 'GRAVADA').length;
  const attendanceRate = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

  const lastAttendance = records.length > 0 ? records[0].class_date : null;

  // Calcular streak (sequência de presenças consecutivas)
  let currentStreak = 0;
  for (const record of records) {
    if (record.attendance_type === 'PRESENTE' || record.attendance_type === 'PRESENÇA') {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    totalClasses,
    presentCount,
    absentCount,
    recordedCount,
    attendanceRate: Math.round(attendanceRate * 10) / 10,
    lastAttendance,
    currentStreak,
  };
}

export async function getMonthlyAttendanceData(
  clientId: string,
  productId?: string,
  year?: number,
  month?: number
): Promise<Map<string, string>> {
  console.log('[frequencyService] Buscando dados do mês:', {
    clientId,
    productId,
    year,
    month,
  });

  const targetDate = year && month ? new Date(year, month - 1, 1) : new Date();
  const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).toISOString().split('T')[0];
  const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0];

  let query = supabase
    .from('class_attendance')
    .select('class_date, attendance_type')
    .eq('client_id', clientId)
    .gte('class_date', startDate)
    .lte('class_date', endDate);

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[frequencyService] Erro ao buscar dados do mês:', error);
    throw error;
  }

  const attendanceMap = new Map<string, string>();
  (data || []).forEach((record: any) => {
    // Extract only YYYY-MM-DD from class_date for easier mapping
    const dateKey = record.class_date.split('T')[0];
    attendanceMap.set(dateKey, record.attendance_type);
  });

  return attendanceMap;
}
