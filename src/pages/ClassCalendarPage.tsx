import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchClassesByMonth, fetchClassDetail, fetchMonthStatistics } from '@/services/classCalendarService';
import { ClassCalendar } from '@/components/attendance/ClassCalendar';
import { ClassCalendarDetail } from '@/components/attendance/ClassCalendarDetail';
import { PageTitle, Select, Skeleton } from '@/components/ui/ds';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Search, Filter, LayoutDashboard, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function ClassCalendarPage() {
  const { session } = useAuth();
  const organizationId = session?.user?.user_metadata?.organization_id;

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['products', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('organization_id', organizationId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  // Set first product as default
  useEffect(() => {
    if (products && products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  // Fetch classes for the month
  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes', organizationId, selectedProductId, currentMonth.getFullYear(), currentMonth.getMonth() + 1],
    queryFn: () => fetchClassesByMonth(
      organizationId!,
      selectedProductId!,
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1
    ),
    enabled: !!organizationId && !!selectedProductId,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['stats', organizationId, selectedProductId, currentMonth.getFullYear(), currentMonth.getMonth() + 1],
    queryFn: () => fetchMonthStatistics(
      organizationId!,
      selectedProductId!,
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1
    ),
    enabled: !!organizationId && !!selectedProductId,
  });

  // Fetch detail for selected date
  const { data: detail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['class-detail', organizationId, selectedProductId, selectedDate],
    queryFn: () => fetchClassDetail(organizationId!, selectedProductId!, selectedDate!),
    enabled: !!organizationId && !!selectedProductId && !!selectedDate,
  });

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
    setSelectedDate(null); // Reset selection when month changes
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <PageTitle 
          title="Calendário de Aulas" 
          subtitle="Visualize e gerencie a presença das suas turmas de forma organizada"
          icon={<Calendar className="w-6 h-6 text-primary-600" />}
        />
        
        <div className="w-full lg:w-72 bg-white p-1 rounded-xl shadow-sm border border-neutral-200">
          <Select
            options={products?.map(p => ({ label: p.name, value: p.id })) || []}
            value={selectedProductId || ''}
            onValueChange={(val) => {
              setSelectedProductId(val);
              setSelectedDate(null);
            }}
            placeholder="Selecione um produto"
            className="border-none focus:ring-0"
          />
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-start gap-1">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Aulas no Mês</span>
            <span className="text-3xl font-bold text-neutral-900">{stats.totalClasses}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-start gap-1">
            <span className="text-xs font-bold text-success-700 uppercase tracking-wider">Registradas</span>
            <span className="text-3xl font-bold text-success-900">{stats.registeredClasses}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-start gap-1">
            <span className="text-xs font-bold text-warning-700 uppercase tracking-wider">Pendentes</span>
            <span className="text-3xl font-bold text-warning-900">{stats.pendingClasses}</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col items-start gap-1">
            <span className="text-xs font-bold text-primary-700 uppercase tracking-wider">Frequência Média</span>
            <span className="text-3xl font-bold text-primary-900">{Math.round(stats.averageAttendanceRate)}%</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 space-y-4">
          {isLoadingClasses ? (
            <Skeleton className="w-full h-[600px] rounded-2xl" />
          ) : (
            <ClassCalendar 
              classes={classes || []} 
              onSelectDate={setSelectedDate}
              selectedDate={selectedDate || undefined}
              onMonthChange={handleMonthChange}
            />
          )}
        </div>

        <div className="space-y-4 sticky top-6">
          {!selectedDate ? (
            <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-center text-neutral-500 min-h-[500px]">
              <div className="bg-neutral-50 p-6 rounded-full mb-4">
                <Calendar className="w-12 h-12 text-neutral-300" />
              </div>
              <p className="text-xl font-bold text-neutral-800">Selecione um dia</p>
              <p className="text-sm max-w-[240px] mt-2 italic leading-relaxed">
                Clique em uma data no calendário para visualizar os detalhes da aula e a lista de presença dos alunos.
              </p>
            </div>
          ) : isLoadingDetail ? (
            <Skeleton className="w-full h-[600px] rounded-2xl" />
          ) : detail ? (
            <ClassCalendarDetail 
              classDate={selectedDate}
              session={detail.session}
              attendances={detail.attendances}
              onClose={() => setSelectedDate(null)}
            />
          ) : (
            <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-center text-neutral-500 min-h-[500px]">
              <div className="bg-neutral-50 p-6 rounded-full mb-4">
                <Search className="w-12 h-12 text-neutral-300" />
              </div>
              <p className="text-xl font-bold text-neutral-800">Sem aula nesta data</p>
              <p className="text-sm max-w-[240px] mt-2 italic leading-relaxed">
                Não existem aulas registradas ou agendadas para o dia selecionado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
