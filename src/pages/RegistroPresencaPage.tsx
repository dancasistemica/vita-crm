import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';
import { AttendanceForm } from '@/components/attendance/AttendanceForm';
import { Card, Skeleton } from '@/components/ui/ds';
import { ClipboardCheck, Loader2 } from 'lucide-react';

export default function RegistroPresencaPage() {
  const { organizationId } = useOrganization();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (organizationId) {
      fetchProducts();
    }
  }, [organizationId]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('[RegistroPresencaPage] Erro ao buscar produtos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-primary" />
            Registro de Presença
          </h1>
          <p className="text-neutral-500">
            Marque manualmente a presença dos seus alunos nas aulas ao vivo.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : organizationId ? (
        <AttendanceForm 
          products={products} 
          organizationId={organizationId} 
        />
      ) : (
        <Card className="p-10 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-neutral-600">Carregando informações da organização...</p>
        </Card>
      )}
    </div>
  );
}
