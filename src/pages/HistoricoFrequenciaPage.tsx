import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar as CalendarIcon, Filter, Search, Download } from 'lucide-react';
import { FrequencyStats } from '@/components/attendance/FrequencyStats';
import { FrequencyCalendar } from '@/components/attendance/FrequencyCalendar';
import { 
  getFrequencyStats, 
  getMonthlyAttendanceData, 
  FrequencyStats as StatsType 
} from '@/services/frequencyService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function HistoricoFrequenciaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState('');
  const [stats, setStats] = useState<StatsType | null>(null);
  const [attendanceMap, setAttendanceMap] = useState<Map<string, string>>(new Map());
  const [currentMonth, setCurrentMonth] = useState({ 
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear() 
  });

  const fetchClientData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // 1. Fetch client name
      const { data: client, error: cError } = await supabase
        .from('clients')
        .select('name')
        .eq('id', id)
        .single();
        
      if (cError) throw cError;
      setClientName(client?.name || 'Cliente');

      // 2. Fetch overall stats (last 90 days)
      const statsData = await getFrequencyStats(id);
      setStats(statsData);

      // 3. Fetch monthly attendance for initial calendar
      const map = await getMonthlyAttendanceData(id, undefined, currentMonth.year, currentMonth.month);
      setAttendanceMap(map);
      
    } catch (error) {
      console.error('[HistoricoFrequencia] Error:', error);
      toast.error('Erro ao carregar histórico de frequência');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
  }, [id]);

  const handleMonthChange = async (month: number, year: number) => {
    if (!id) return;
    setCurrentMonth({ month, year });
    try {
      const map = await getMonthlyAttendanceData(id, undefined, year, month);
      setAttendanceMap(map);
    } catch (error) {
      toast.error('Erro ao carregar dados do mês');
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Histórico de Frequência</h1>
            <p className="text-sm text-neutral-500">
              Cliente: <span className="font-medium text-neutral-700">{clientName}</span>
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 shadow-sm">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <FrequencyStats 
          totalClasses={stats.totalClasses}
          presentCount={stats.presentCount}
          absentCount={stats.absentCount}
          recordedCount={stats.recordedCount}
          attendanceRate={stats.attendanceRate}
          lastAttendance={stats.lastAttendance}
          currentStreak={stats.currentStreak}
        />
      )}

      {/* Calendar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FrequencyCalendar 
            attendanceData={attendanceMap} 
            onMonthChange={handleMonthChange}
          />
        </div>
        
        {/* Engagement Info / Legend Cards */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm">
            <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
              Legenda do Período
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-neutral-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">P</span>
                  </div>
                  <span className="text-sm text-neutral-600">Presença Confirmada</span>
                </div>
                <span className="text-sm font-medium">{stats?.presentCount}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-neutral-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                    <span className="text-red-600 font-bold text-sm">X</span>
                  </div>
                  <span className="text-sm text-neutral-600">Ausência Registrada</span>
                </div>
                <span className="text-sm font-medium">{stats?.absentCount}</span>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                    <Download className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-neutral-600">Aula Gravada</span>
                </div>
                <span className="text-sm font-medium">{stats?.recordedCount}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-600 p-6 rounded-lg text-white shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-semibold mb-2">Engajamento</h3>
              <p className="text-sm text-blue-100 mb-4">
                O cliente está com um nível de engajamento acima da média da turma.
              </p>
              <div className="text-3xl font-bold">Excelente</div>
            </div>
            <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-10">
              <CalendarIcon className="w-24 h-24" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
