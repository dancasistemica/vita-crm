import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersTab from "@/components/settings/UsersTab";
import CRMFieldsTab from "@/components/settings/CRMFieldsTab";
import TagsTab from "@/components/settings/TagsTab";
import FunnelStagesTab from "@/components/settings/FunnelStagesTab";
import PaymentMethodsTab from "@/components/settings/PaymentMethodsTab";
import UserProfileTab from "@/components/settings/UserProfileTab";
import UserRolesManager from "@/components/settings/UserRolesManager";
import OrganizationPage from "@/pages/OrganizationPage";
import { useUserRole } from "@/hooks/useUserRole";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function ConfiguracoesPage() {
  const { canAccessSettings } = useUserRole();

  const tabCount = canAccessSettings ? 8 : 6;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display text-foreground">⚙️ Configurações</h1>
      <Tabs defaultValue="perfil" className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-max min-w-full">
            <TabsTrigger value="perfil">👤 Meu Perfil</TabsTrigger>
            <TabsTrigger value="usuarios">👥 Usuários</TabsTrigger>
            <TabsTrigger value="campos">📋 Campos do CRM</TabsTrigger>
            <TabsTrigger value="tags">🏷️ Tags</TabsTrigger>
            <TabsTrigger value="funil">📈 Funil de Vendas</TabsTrigger>
            <TabsTrigger value="pagamento">💳 Pagamento</TabsTrigger>
            {canAccessSettings && <TabsTrigger value="permissoes">🔐 Permissões</TabsTrigger>}
            {canAccessSettings && <TabsTrigger value="organizacao">🏢 Organização</TabsTrigger>}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <TabsContent value="perfil"><UserProfileTab /></TabsContent>
        <TabsContent value="usuarios"><UsersTab /></TabsContent>
        <TabsContent value="campos"><CRMFieldsTab /></TabsContent>
        <TabsContent value="tags"><TagsTab /></TabsContent>
        <TabsContent value="funil"><FunnelStagesTab /></TabsContent>
        <TabsContent value="pagamento"><PaymentMethodsTab /></TabsContent>
        {canAccessSettings && <TabsContent value="permissoes"><UserRolesManager /></TabsContent>}
        {canAccessSettings && <TabsContent value="organizacao"><OrganizationPage /></TabsContent>}
      </Tabs>
    </div>
  );
}
