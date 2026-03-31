import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, Badge, Alert } from "@/components/ui/ds";
import UsersTab from "@/components/settings/UsersTab";
import CRMFieldsTab from "@/components/settings/CRMFieldsTab";
import PaymentMethodsTab from "@/components/settings/PaymentMethodsTab";
import UserRolesManager from "@/components/settings/UserRolesManager";
import CustomRolesTab from "@/components/settings/CustomRolesTab";
import OrganizationPage from "@/pages/OrganizationPage";
import AIContextTab from "@/components/settings/AIContextTab";
import { useUserRole } from "@/hooks/useUserRole";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Users, ClipboardList, CreditCard, Shield, Lock, Building2, Brain } from "lucide-react";

export default function ConfiguracoesPage() {
  const { canAccessSettings } = useUserRole();
  const [activeTab, setActiveTab] = useState("usuarios");
  const [preselectedRole, setPreselectedRole] = useState<string | null>(null);

  const handleRoleCreated = (roleName: string) => {
    setPreselectedRole(roleName);
    setActiveTab("permissoes");
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold text-neutral-900">Configurações</h1>
        <p className="text-sm text-neutral-600 mt-1">Gerencie usuários, permissões e parâmetros do sistema</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v !== "permissoes") setPreselectedRole(null); }} className="w-full space-y-4">
        <div className="overflow-x-auto pb-2">
          <TabsList className="flex w-max min-w-full">
            <TabsTrigger value="usuarios" className="gap-3"><Users className="w-4 h-4" /> Usuários</TabsTrigger>
            <TabsTrigger value="campos" className="gap-3"><ClipboardList className="w-4 h-4" /> Campos do CRM</TabsTrigger>
            <TabsTrigger value="pagamento" className="gap-3"><CreditCard className="w-4 h-4" /> Pagamento</TabsTrigger>
            {canAccessSettings && <TabsTrigger value="roles" className="gap-3"><Shield className="w-4 h-4" /> Roles</TabsTrigger>}
            {canAccessSettings && <TabsTrigger value="permissoes" className="gap-3"><Lock className="w-4 h-4" /> Permissões</TabsTrigger>}
            {canAccessSettings && <TabsTrigger value="organizacao" className="gap-3"><Building2 className="w-4 h-4" /> Organização</TabsTrigger>}
            {canAccessSettings && <TabsTrigger value="ia" className="gap-3"><Brain className="w-4 h-4" /> Contexto IA</TabsTrigger>}
          </TabsList>
        </div>

        <Card variant="elevated" padding="lg">
          <TabsContent value="usuarios"><UsersTab /></TabsContent>
          <TabsContent value="campos"><CRMFieldsTab /></TabsContent>
          <TabsContent value="pagamento"><PaymentMethodsTab /></TabsContent>
          {canAccessSettings && <TabsContent value="roles"><CustomRolesTab onRoleCreated={handleRoleCreated} /></TabsContent>}
          {canAccessSettings && <TabsContent value="permissoes"><UserRolesManager preselectedRole={preselectedRole} /></TabsContent>}
          {canAccessSettings && <TabsContent value="organizacao"><OrganizationPage /></TabsContent>}
          {canAccessSettings && <TabsContent value="ia"><AIContextTab /></TabsContent>}
        </Card>
      </Tabs>
    </div>
  );
}
