import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersTab from "@/components/settings/UsersTab";
import CRMFieldsTab from "@/components/settings/CRMFieldsTab";
import TagsTab from "@/components/settings/TagsTab";
import FunnelStagesTab from "@/components/settings/FunnelStagesTab";
import PaymentMethodsTab from "@/components/settings/PaymentMethodsTab";

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display text-foreground">⚙️ Configurações</h1>
      <Tabs defaultValue="usuarios" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="usuarios">👥 Usuários</TabsTrigger>
          <TabsTrigger value="campos">📋 Campos do CRM</TabsTrigger>
          <TabsTrigger value="tags">🏷️ Tags</TabsTrigger>
          <TabsTrigger value="funil">📈 Funil de Vendas</TabsTrigger>
          <TabsTrigger value="pagamento">💳 Pagamento</TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios"><UsersTab /></TabsContent>
        <TabsContent value="campos"><CRMFieldsTab /></TabsContent>
        <TabsContent value="tags"><TagsTab /></TabsContent>
        <TabsContent value="funil"><FunnelStagesTab /></TabsContent>
        <TabsContent value="pagamento"><PaymentMethodsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
