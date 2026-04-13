import React, { useState, useEffect } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { getIntegrations, Integration } from "@/services/integrationService";
import { PageTitle, ScrollArea, Skeleton } from "@/components/ui/ds";
import { IntegrationsList } from "@/components/integrations/IntegrationsList";
import { AsaasIntegration } from "@/components/integrations/AsaasIntegration";
import { ChevronLeft } from "lucide-react";

const IntegrationsPage: React.FC = () => {
  const { organization } = useOrganization();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    if (!organization?.id) return;
    
    try {
      const data = await getIntegrations(organization.id);
      setIntegrations(data);
    } catch (error) {
      console.error("Erro ao buscar integrações:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, [organization?.id]);

  const handleIntegrationSaved = (updated: Integration) => {
    setIntegrations(prev => {
      const filtered = prev.filter(i => i.id !== updated.id && i.integration_type !== updated.integration_type);
      return [updated, ...filtered];
    });
  };

  const getActiveIntegration = (type: string) => {
    return integrations.find(i => i.integration_type === type) || null;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-neutral-50/30">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-2 mb-2">
          {selectedType && (
            <button 
              onClick={() => setSelectedType(null)}
              className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-500" />
            </button>
          )}
          <PageTitle>Integrações</PageTitle>
        </div>
        <p className="text-neutral-500 max-w-2xl">
          {selectedType 
            ? `Configure os detalhes da sua integração com ${selectedType === 'asaas' ? 'Asaas' : selectedType}.`
            : "Conecte sua conta com ferramentas externas para automatizar seu fluxo de trabalho e sincronizar pagamentos."}
        </p>
      </div>

      <ScrollArea className="flex-1 px-8 pb-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="max-w-5xl">
            {!selectedType ? (
              <IntegrationsList 
                integrations={integrations} 
                onSelect={setSelectedType}
              />
            ) : (
              <div className="mt-4">
                {selectedType === 'asaas' && (
                  <AsaasIntegration 
                    organizationId={organization?.id || ""} 
                    existingIntegration={getActiveIntegration('asaas')}
                    onSave={handleIntegrationSaved}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default IntegrationsPage;
