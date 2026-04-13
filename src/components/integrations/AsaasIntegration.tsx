import React, { useState, useEffect } from "react";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Input, Button, Label, Badge, PageTitle
} from "@/components/ui/ds";
import { ExternalLink, Check, RefreshCw, AlertCircle, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { testAsaasConnection, fetchAsaasPayments, syncPaymentsWithSales } from "@/services/asaasService";
import { saveIntegration, Integration } from "@/services/integrationService";
import { SyncStatus } from "./SyncStatus";

interface AsaasIntegrationProps {
  organizationId: string;
  existingIntegration?: Integration | null;
  onSave?: (integration: Integration) => void;
}

export const AsaasIntegration: React.FC<AsaasIntegrationProps> = ({
  organizationId,
  existingIntegration,
  onSave
}) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [integration, setIntegration] = useState<Integration | null>(existingIntegration || null);

  useEffect(() => {
    if (existingIntegration?.credentials?.api_key) {
      setApiKey(existingIntegration.credentials.api_key);
      setIntegration(existingIntegration);
    }
  }, [existingIntegration]);

  const handleTestConnection = async () => {
    if (!apiKey) {
      toast({
        title: "Chave API necessária",
        description: "Por favor, insira a chave API do Asaas.",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    try {
      const success = await testAsaasConnection(apiKey);
      if (success) {
        toast({
          title: "Conexão bem-sucedida!",
          description: "A chave API é válida.",
          variant: "default"
        });
      } else {
        toast({
          title: "Erro na conexão",
          description: "A chave API parece inválida ou houve um erro de rede.",
          variant: "destructive"
        });
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey) return;
    
    setIsSaving(true);
    try {
      const saved = await saveIntegration(organizationId, {
        integration_type: 'asaas',
        name: 'Asaas',
        description: 'Integração para sincronização de pagamentos',
        is_active: true,
        credentials: { api_key: apiKey },
        sync_config: {
          auto_sync: true,
          sync_interval_hours: 24,
          last_sync: integration?.sync_config?.last_sync || '',
          next_sync: ''
        },
        status: integration?.status || 'pending'
      });
      
      setIntegration(saved);
      if (onSave) onSave(saved);
      
      toast({
        title: "Configurações salvas",
        description: "A integração com Asaas foi configurada com sucesso.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSync = async () => {
    if (!integration?.credentials?.api_key) return;
    
    setIsSyncing(true);
    try {
      toast({
        title: "Sincronização iniciada",
        description: "Buscando pagamentos no Asaas...",
      });

      const payments = await fetchAsaasPayments(integration.credentials.api_key);
      const result = await syncPaymentsWithSales(organizationId, payments);

      // Atualizar última sincronização
      const updatedSyncConfig = {
        ...integration.sync_config,
        last_sync: new Date().toISOString()
      };

      const updated = await saveIntegration(organizationId, {
        ...integration,
        sync_config: updatedSyncConfig,
        status: 'synced'
      });

      setIntegration(updated);

      toast({
        title: "Sincronização concluída",
        description: `${result.synced} vendas sincronizadas. ${result.failed} não encontradas.`,
      });
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: "Houve um erro ao sincronizar os pagamentos.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xl">
                A
              </div>
              <div>
                <CardTitle>Asaas</CardTitle>
                <CardDescription>Sincronize pagamentos automaticamente com suas vendas.</CardDescription>
              </div>
            </div>
            {integration && (
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                Conectado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="api-key">Chave de API (Access Token)</Label>
              <div className="flex gap-2">
                <Input 
                  id="api-key" 
                  type="password" 
                  placeholder="$a..." 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="max-w-md"
                />
                <Button 
                  variant="outline" 
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                  Testar
                </Button>
              </div>
              <p className="text-xs text-neutral-500 flex items-center gap-1">
                Obtenha sua chave em <a href="https://www.asaas.com/customer/config" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-0.5">Configurações do Asaas <ExternalLink className="w-3 h-3" /></a>
              </p>
            </div>

            <div className="flex flex-wrap gap-4 items-end justify-between pt-4 border-t">
              {integration && (
                <SyncStatus 
                  status={integration.status} 
                  lastSync={integration.sync_config?.last_sync}
                  errorMessage={integration.error_message}
                />
              )}

              <div className="flex gap-2">
                {integration && (
                  <Button 
                    variant="outline" 
                    onClick={handleManualSync}
                    disabled={isSyncing}
                  >
                    {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Sincronizar Agora
                  </Button>
                )}
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving || !apiKey}
                  className="bg-primary text-white"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  {integration ? "Salvar Alterações" : "Ativar Integração"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-neutral-50 border-dashed">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-start">
            <div className="p-2 bg-white rounded-full border">
              <AlertCircle className="w-5 h-5 text-neutral-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Como funciona a sincronização?</h4>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Ao ativar o Asaas, o sistema buscará periodicamente novos pagamentos. 
                As vendas serão atualizadas automaticamente para "Concluída" quando o pagamento for identificado como "Recebido" ou "Confirmado" no Asaas, utilizando o e-mail do cliente para o vínculo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
