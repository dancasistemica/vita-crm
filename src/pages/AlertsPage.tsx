import React, { useState, useEffect } from 'react';
import { useOrganization } from "@/contexts/OrganizationContext";
import { Card, Button, Select, PageTitle, Toaster } from "@/components/ui/ds";
import { AlertsList } from "@/components/alerts/AlertsList";
import { AlertActions } from "@/components/alerts/AlertActions";
import { generateAlertsForProduct, resolveAlert, ClientAlert } from "@/services/alertService";
import { fetchProductsForOrganization } from "@/services/attendanceService";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCcw, Bell, AlertTriangle } from "lucide-react";

export default function AlertsPage() {
  const { organizationId } = useOrganization();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [alerts, setAlerts] = useState<ClientAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<ClientAlert | null>(null);

  useEffect(() => {
    if (organizationId) {
      loadProducts();
    }
  }, [organizationId]);

  const loadProducts = async () => {
    try {
      const data = await fetchProductsForOrganization(organizationId);
      setProducts(data);
      if (data.length > 0) {
        setSelectedProductId(data[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };

  const handleGenerateAlerts = async () => {
    if (!selectedProductId) return;
    
    setLoading(true);
    try {
      const data = await generateAlertsForProduct(organizationId, selectedProductId);
      setAlerts(data);
      toast({
        title: "Busca concluída",
        description: `Encontrados ${data.length} potenciais riscos de churn.`,
      });
    } catch (error) {
      console.error("Erro ao gerar alertas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar os alertas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (alertId: string, action: string) => {
    try {
      await resolveAlert(alertId, action);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast({
        title: "Sucesso",
        description: "Alerta resolvido com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível resolver o alerta.",
        variant: "destructive",
      });
    }
  };

  const handleContact = (alert: ClientAlert) => {
    setSelectedAlert(alert);
    setIsActionModalOpen(true);
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <PageTitle 
            title="Alertas de Churn" 
            subtitle="Identifique clientes que não estão vindo nem assistindo gravações"
          />
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedProductId}
            onValueChange={setSelectedProductId}
            options={products.map(p => ({ label: p.name, value: p.id }))}
            placeholder="Selecione um produto"
            className="w-full sm:w-64"
          />
          <Button 
            variant="primary" 
            onClick={handleGenerateAlerts} 
            loading={loading}
            className="shrink-0"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Analisar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AlertsList 
            alerts={alerts} 
            onResolve={handleResolve} 
            onContact={handleContact}
            loading={loading}
          />
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary-500" />
              Como funciona?
            </h3>
            <div className="space-y-4 text-sm text-neutral-600">
              <p>
                O sistema analisa os últimos 30 dias de cada aluno, cruzando a presença nas aulas ao vivo com o registro de aulas gravadas assistidas.
              </p>
              <div className="bg-primary-50 p-3 rounded-lg border border-primary-100">
                <p className="font-semibold text-primary-800 mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Regra de Falta Real
                </p>
                <p className="text-xs text-primary-700">
                  Um aluno é marcado com "Falta Real" apenas se ele <strong>não estiver presente</strong> na aula ao vivo <strong>E não tiver registro</strong> de ter assistido à gravação.
                </p>
              </div>
              <ul className="list-disc pl-4 space-y-2">
                <li><strong>Leve:</strong> 3 faltas reais seguidas</li>
                <li><strong>Moderado:</strong> 4 faltas reais seguidas</li>
                <li><strong>Crítico:</strong> 5 ou mais faltas reais seguidas</li>
              </ul>
            </div>
          </Card>

          <Card className="p-6 bg-neutral-900 text-white border-none">
            <h3 className="text-lg font-bold mb-2">Dica Pro</h3>
            <p className="text-neutral-400 text-sm">
              Clientes que param de assistir até as gravações geralmente estão prestes a cancelar a assinatura. Entre em contato o quanto antes para oferecer ajuda.
            </p>
          </Card>
        </div>
      </div>

      <AlertActions 
        alert={selectedAlert}
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onResolve={handleResolve}
      />
    </div>
  );
}
