import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { identifyChurnRisks, updateAlertStatus, ChurnAlert } from '@/services/churnService';
import { useOrganization } from '@/contexts/OrganizationContext';
import { PageTitle } from '@/components/ui/ds/PageTitle';
import ChurnDashboard from '@/components/churn/ChurnDashboard';
import ChurnAlertCard from '@/components/churn/ChurnAlertCard';
import { Skeleton } from '@/components/ui/ds/Skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/ds/Tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/ds/Alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/ds/Button';
import { toast } from 'sonner';

const ChurnMonitoringPage: React.FC = () => {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');

  const { data: alerts = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['churn-alerts', organizationId],
    queryFn: () => identifyChurnRisks(organizationId!),
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const mutation = useMutation({
    mutationFn: ({ id, status, note, method }: { id: string; status: ChurnAlert['status']; note?: string; method?: string }) => 
      updateAlertStatus(id, status, note, method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['churn-alerts', organizationId] });
      toast.success('Status do alerta atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar status do alerta.');
    }
  });

  const handleStatusUpdate = (id: string, status: ChurnAlert['status'], note?: string, method?: string) => {
    mutation.mutate({ id, status, note, method });
  };

  const filteredAlerts = alerts.filter(alert => {
    if (activeTab === 'pending') return alert.status === 'pending';
    if (activeTab === 'contacted') return alert.status === 'contacted';
    if (activeTab === 'resolved') return alert.status === 'resolved';
    return true;
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <PageTitle title="Monitoramento de Churn" subtitle="Identifique clientes em risco e automatize a retenção" />
        </div>
        <Button 
          variant="secondary" 
          onClick={() => refetch()} 
          loading={isFetching}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Atualizar Dados
        </Button>
      </div>

      {isError && (
        <Alert variant="error" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os alertas de churn. Por favor, tente novamente.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 w-full" />)}
          </div>
        </div>
      ) : (
        <>
          <ChurnDashboard alerts={alerts} />

          <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="pending">
                Pendentes ({alerts.filter(a => a.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="contacted">
                Em Contato ({alerts.filter(a => a.status === 'contacted').length})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolvidos ({alerts.filter(a => a.status === 'resolved').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-20 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
                  <Users className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-600">Nenhum alerta encontrado</h3>
                  <p className="text-neutral-400">Tudo sob controle por aqui!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAlerts.map(alert => (
                    <ChurnAlertCard 
                      key={alert.id} 
                      alert={alert} 
                      onStatusUpdate={handleStatusUpdate} 
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default ChurnMonitoringPage;
