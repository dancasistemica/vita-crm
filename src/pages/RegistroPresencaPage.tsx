import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { PageTitle, Skeleton, Alert, Toaster, Button } from '@/components/ui/ds';
import { ClipboardCheck, ArrowLeft, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AttendanceForm } from '@/components/attendance/AttendanceForm';
import { WeeklyClassesList } from '@/components/attendance/WeeklyClassesList';
import { ClassSearchFilters } from '@/components/attendance/ClassSearchFilters';
import { 
  fetchProductsForOrganization, 
  saveAttendance, 
  fetchWeeklyClasses 
} from '@/services/attendanceService';
import { saveClassSession } from '@/services/classSessionService';

export default function RegistroPresencaPage() {
  const { organizationId } = useOrganization();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const urlProductId = searchParams.get('product');
  const urlDate = searchParams.get('date');

  const [products, setProducts] = useState<any[]>([]);
  const [weeklyClasses, setWeeklyClasses] = useState<any[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(urlProductId || undefined);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(!!(urlProductId && urlDate));

  useEffect(() => {
    if (organizationId) {
      loadProducts();
    }
  }, [organizationId]);

  // Atualiza visibilidade do form se os parâmetros da URL mudarem
  useEffect(() => {
    setShowForm(!!(urlProductId && urlDate));
  }, [urlProductId, urlDate]);

  useEffect(() => {
    console.log('[RegistroPresencaPage] useEffect: Carregando aulas');
    console.log('[RegistroPresencaPage] Parâmetros:', {
      organizationId,
      selectedProductId,
    });

    if (organizationId) {
      console.log('[RegistroPresencaPage] ✅ Chamando loadWeeklyClasses');
      loadWeeklyClasses();
    } else {
      console.warn('[RegistroPresencaPage] ⚠️ organizationId não disponível');
    }
  }, [organizationId, selectedProductId]);

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const productsData = await fetchProductsForOrganization(organizationId!);
      setProducts(productsData);
    } catch (error) {
      console.error('[RegistroPresencaPage] Erro ao carregar produtos:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadWeeklyClasses = async () => {
    try {
      setIsLoadingWeekly(true);
      console.log('[RegistroPresencaPage] 🔄 loadWeeklyClasses iniciado');
      console.log('[RegistroPresencaPage] Chamando fetchWeeklyClasses com:', {
        organizationId: organizationId!,
        productId: selectedProductId || 'undefined',
      });

      const data = await fetchWeeklyClasses(
        organizationId!,
        selectedProductId
      );

      console.log('[RegistroPresencaPage] ✅ Aulas retornadas:', data.length);
      console.log('[RegistroPresencaPage] Dados:', data);

      setWeeklyClasses(data);
      setFilteredClasses(data);
    } catch (error) {
      console.error('[RegistroPresencaPage] ❌ Erro em loadWeeklyClasses:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar as aulas da semana.',
      });
      setWeeklyClasses([]);
      setFilteredClasses([]);
    } finally {
      setIsLoadingWeekly(false);
    }
  };

  const handleFilterChange = (filters: {
    productId?: string;
    searchTerm?: string;
    dateStart?: string;
    dateEnd?: string;
  }) => {
    // Se o produto mudou, atualizamos o estado para disparar o fetch via useEffect
    if (filters.productId !== selectedProductId) {
      console.log('[RegistroPresencaPage] Produto alterado no filtro:', filters.productId);
      setSelectedProductId(filters.productId);
      return;
    }

    let filtered = [...weeklyClasses];

    if (filters.productId) {
      filtered = filtered.filter(cls => cls.product_id === filters.productId);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(cls => 
        cls.product_name.toLowerCase().includes(term) || 
        cls.description.toLowerCase().includes(term)
      );
    }

    if (filters.dateStart) {
      filtered = filtered.filter(cls => cls.class_date >= filters.dateStart!);
    }

    if (filters.dateEnd) {
      filtered = filtered.filter(cls => cls.class_date <= filters.dateEnd!);
    }

    setFilteredClasses(filtered);
  };

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(cls => 
        cls.product_name.toLowerCase().includes(term) || 
        cls.description.toLowerCase().includes(term)
      );
    }

    if (filters.dateStart) {
      filtered = filtered.filter(cls => cls.class_date >= filters.dateStart!);
    }

    if (filters.dateEnd) {
      filtered = filtered.filter(cls => cls.class_date <= filters.dateEnd!);
    }

    setFilteredClasses(filtered);
  };

  const handleSelectClass = (classData: any) => {
    setSearchParams({
      product: classData.product_id,
      date: classData.class_date
    });
    setShowForm(true);
  };

  const handleBackToList = () => {
    setSearchParams({});
    setShowForm(false);
    // Recarregar aulas semanais para ver estatísticas atualizadas
    loadWeeklyClasses();
  };

  const handleSubmitAttendance = async (data: {
    product_id: string;
    class_date: string;
    class_description: string;
    attendances: Array<{
      client_id: string;
      attendance_type: 'presente' | 'ausente' | 'gravada';
    }>;
  }) => {
    if (!organizationId) return;

    setIsSaving(true);
    try {
      await saveClassSession(
        organizationId,
        data.product_id,
        data.class_date,
        data.class_description
      );

      await saveAttendance(
        organizationId,
        data.product_id,
        data.class_date,
        data.attendances
      );

      toast({
        title: 'Sucesso',
        description: 'Registro de presença salvo com sucesso!',
      });
      
      // Voltar para a listagem após salvar
      handleBackToList();
    } catch (error) {
      console.error('[RegistroPresencaPage] Erro ao salvar:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o registro.',
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  if (!organizationId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="error">
          Nenhuma organização selecionada. Por favor, selecione uma organização primeiro.
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageTitle 
          title="Registro de Presença" 
          description="Acompanhe as aulas da semana e registre a presença dos seus alunos."
          icon={<ClipboardCheck className="w-8 h-8 text-primary-500" />}
        />
        
      </div>

      {showForm ? (
        <div className="space-y-6">
          <Button 
            variant="ghost" 
            onClick={handleBackToList}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Voltar para Listagem
          </Button>

          {isLoadingProducts ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <AttendanceForm
              organizationId={organizationId}
              products={products}
              onSubmit={handleSubmitAttendance}
              isLoading={isSaving}
              initialData={urlProductId && urlDate ? {
                product_id: urlProductId,
                class_date: urlDate,
                class_description: '',
                attendances: []
              } : undefined}
            />
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <ClassSearchFilters 
            products={products} 
            onFilterChange={handleFilterChange} 
          />
          
          <WeeklyClassesList
            classes={weeklyClasses}
            filteredClasses={filteredClasses}
            onSelectClass={handleSelectClass}
            isLoading={isLoadingWeekly}
          />
        </div>
      )}
      <Toaster />
    </div>
  );
}
