import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { PageTitle, Skeleton, Alert, Toaster } from '@/components/ui/ds';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AttendanceForm } from '@/components/attendance/AttendanceForm';
import { fetchProductsForOrganization, saveAttendance } from '@/services/attendanceService';
import { saveClassSession } from '@/services/classSessionService';

export default function RegistroPresencaPage() {
  const { organizationId } = useOrganization();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (organizationId) {
      loadProducts();
    }
  }, [organizationId]);

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const data = await fetchProductsForOrganization(organizationId!);
      setProducts(data);
    } catch (error) {
      console.error('[RegistroPresencaPage] Erro ao buscar produtos:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os produtos da organização.',
      });
    } finally {
      setIsLoadingProducts(false);
    }
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
      console.log('[RegistroPresencaPage] Iniciando salvamento de presença e sessão');

      // PASSO 1: Salvar a descrição da sessão de aula
      await saveClassSession(
        organizationId,
        data.product_id,
        data.class_date,
        data.class_description
      );

      // PASSO 2: Salvar os registros de presença dos alunos
      await saveAttendance(
        organizationId,
        data.product_id,
        data.class_date,
        data.attendances
      );

      toast({
        title: 'Sucesso',
        description: 'Registro de presença e descrição da aula salvos com sucesso!',
      });
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
      <div className="space-y-2">
        <PageTitle 
          title="Registro de Presença" 
          description="Marque a presença dos alunos nas aulas e mantenha o histórico atualizado."
          icon={<ClipboardCheck className="w-8 h-8 text-primary-500" />}
        />
      </div>

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
        />
      )}
      <Toaster />
    </div>
  );
}
