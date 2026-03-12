import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UsersTab from "@/components/settings/UsersTab";
import CRMFieldsTab from "@/components/settings/CRMFieldsTab";
import PaymentMethodsTab from "@/components/settings/PaymentMethodsTab";
import UserRolesManager from "@/components/settings/UserRolesManager";
import CustomRolesTab from "@/components/settings/CustomRolesTab";
import OrganizationPage from "@/pages/OrganizationPage";
import AIContextTab from "@/components/settings/AIContextTab";
import { useUserRole } from "@/hooks/useUserRole";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function ConfiguracoesPage() {
  const { canAccessSettings } = useUserRole();
  const [activeTab, setActiveTab] = useState("usuarios");
  const [preselectedRole, setPreselectedRole] = useState<string | null>(null);

  const handleRoleCreated = (roleName: string) => {
    setPreselectedRole(roleName);
    setActiveTab("permissoes");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display text-foreground">⚙️ Configurações</h1>
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v !== "permissoes") setPreselectedRole(null); }} className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-max min-w-full">
            <TabsTrigger value="usuarios">👥 Usuários</TabsTrigger>
            <TabsTrigger value="campos">📋 Campos do CRM</TabsTrigger>
            <TabsTrigger value="pagamento">💳 Pagamento</TabsTrigger>
            {canAccessSettings && <TabsTrigger value="roles">🏷️ Roles</TabsTrigger>}
            {canAccessSettings && <TabsTrigger value="permissoes">🔐 Permissões</TabsTrigger>}
            {canAccessSettings && <TabsTrigger value="organizacao">🏢 Organização</TabsTrigger>}
            {canAccessSettings && <TabsTrigger value="ia">🧠 Contexto IA</TabsTrigger>}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <TabsContent value="usuarios"><UsersTab /></TabsContent>
        <TabsContent value="campos"><CRMFieldsTab /></TabsContent>
        <TabsContent value="pagamento"><PaymentMethodsTab /></TabsContent>
        {canAccessSettings && <TabsContent value="roles"><CustomRolesTab onRoleCreated={handleRoleCreated} /></TabsContent>}
        {canAccessSettings && <TabsContent value="permissoes"><UserRolesManager preselectedRole={preselectedRole} /></TabsContent>}
        {canAccessSettings && <TabsContent value="organizacao"><OrganizationPage /></TabsContent>}
      </Tabs>
    </div>
  );
}
