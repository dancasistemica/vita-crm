import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersTab from "@/components/settings/UsersTab";
import CRMFieldsTab from "@/components/settings/CRMFieldsTab";
import PaymentMethodsTab from "@/components/settings/PaymentMethodsTab";
import PaymentMethodsTab from "@/components/settings/PaymentMethodsTab";
import UserRolesManager from "@/components/settings/UserRolesManager";
import OrganizationPage from "@/pages/OrganizationPage";
import { useUserRole } from "@/hooks/useUserRole";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function ConfiguracoesPage() {
  const { canAccessSettings } = useUserRole();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display text-foreground">⚙️ Configurações</h1>
      <Tabs defaultValue="usuarios" className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-max min-w-full">
            <TabsTrigger value="usuarios">👥 Usuários</TabsTrigger>
            <TabsTrigger value="campos">📋 Campos do CRM</TabsTrigger>
            <TabsTrigger value="pagamento">💳 Pagamento</TabsTrigger>
            {canAccessSettings && <TabsTrigger value="permissoes">🔐 Permissões</TabsTrigger>}
            {canAccessSettings && <TabsTrigger value="organizacao">🏢 Organização</TabsTrigger>}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <TabsContent value="usuarios"><UsersTab /></TabsContent>
        <TabsContent value="campos"><CRMFieldsTab /></TabsContent>
        <TabsContent value="pagamento"><PaymentMethodsTab /></TabsContent>
        {canAccessSettings && <TabsContent value="permissoes"><UserRolesManager /></TabsContent>}
        {canAccessSettings && <TabsContent value="organizacao"><OrganizationPage /></TabsContent>}
      </Tabs>
    </div>
  );
}
