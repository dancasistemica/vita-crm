import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { fetchClassesByMonth, fetchClassDetail, fetchMonthStatistics } from '@/services/classCalendarService';
import { fetchProductsForOrganization } from '@/services/attendanceService';
import { ClassCalendar } from '@/components/attendance/ClassCalendar';
import { ClassCalendarDetail } from '@/components/attendance/ClassCalendarDetail';
import { ClassCalendarNewClass } from '@/components/attendance/ClassCalendarNewClass';
import { PageTitle, Select, Skeleton, Button } from '@/components/ui/ds';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Search, Filter, LayoutDashboard, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ClassCalendarPage() {
  const { session } = useAuth();
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const queryClient = useQueryClient();

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [showNewClassModal, setShowNewClassModal] = useState(false);
  const [newClassDate, setNewClassDate] = useState<string>('');

  useEffect(() => {
    console.log('[ClassCalendarPage] useEffect disparado');
    console.log('[ClassCalendarPage] organization:', organization);

    if (organization?.id) {
      console.log('[ClassCalendarPage] Carregando produtos para org:', organization.id);
      loadProducts();
    } else {
      console.warn('[ClassCalendarPage] ⚠️ organization?.id não disponível');
    }
  }, [organization?.id]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      console.log('[ClassCalendarPage] Iniciando loadProducts');

      if (!organization?.id) {
        console.error('[ClassCalendarPage] ❌ organization?.id é undefined');
        toast.error('Organização não carregada. Recarregue a página.');
        setProducts([]);
        return;
      }

      console.log('[ClassCalendarPage] Chamando fetchProductsForOrganization com:', organization.id);
      const data = await fetchProductsForOrganization(organization.id);
      
      console.log('[ClassCalendarPage] ✅ Produtos retornados:', data);
      console.log('[ClassCalendarPage] Total de produtos:', data.length);

      setProducts(data);

      if (data && data.length > 0) {
        console.log('[ClassCalendarPage] Selecionando primeiro produto:', data[0].id);
        setSelectedProductId(data[0].id);
      } else {
        console.warn('[ClassCalendarPage] ⚠️ Nenhum produto encontrado para org:', organization.id);
        setSelectedProductId('');
        toast.warning('Nenhum produto cadastrado. Crie um produto primeiro.');
      }
    } catch (error) {
      console.error('[ClassCalendarPage] ❌ Erro ao carregar produtos:', error);
      console.error('[ClassCalendarPage] Stack:', error instanceof Error ? error.stack : 'N/A');
      toast.error(`Erro ao carregar produtos: ${error instanceof Error ? error.message : 'Desconhecido'}`);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewClass = async (formData: {
    class_date: string;
    description: string;
  }) => {
    try {
      console.log('[ClassCalendarPage] Criando nova aula:', formData);

      const { saveClassSession } = await import('@/services/classSessionService');
      
      await saveClassSession(
        organization!.id,
        selectedProductId,
        formData.class_date,
        formData.description
      );

      console.log('[ClassCalendarPage] ✅ Aula criada com sucesso');
      toast.success('Aula criada! Agora registre a presença.');
      
      setShowNewClassModal(false);
      setNewClassDate(formData.class_date);
      
      // Recarregar aulas
      await queryClient.invalidateQueries({ queryKey: ['classes', organizationId, selectedProductId] });
      await queryClient.invalidateQueries({ queryKey: ['stats', organizationId, selectedProductId] });
      
      // Abrir detalhes da aula criada
      setSelectedDate(formData.class_date);

    } catch (error) {
      console.error('[ClassCalendarPage] ❌ Erro ao criar aula:', error);
      toast.error('Erro ao criar aula');
    }
  };

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
          description="Visualize e gerencie a presença das suas turmas de forma organizada"
          icon={<Calendar className="w-6 h-6 text-primary-600" />}
        />
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
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

          {selectedProductId && (
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={() => setShowNewClassModal(true)}
                className="flex-1 px-8"
              >
                + Nova Aula
              </Button>
            </div>
          )}
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

      {showNewClassModal && (
        <ClassCalendarNewClass
          organizationId={organization!.id}
          productId={selectedProductId}
          onClose={() => setShowNewClassModal(false)}
          onSubmit={handleCreateNewClass}
        />
      )}
    </div>
  );
}
