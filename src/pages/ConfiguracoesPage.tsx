import { Alert, Badge, Card, ScrollArea, ScrollBar, Tabs } from "@/components/ui/ds";
import { useState } from "react";
import UsersTab from "@/components/settings/UsersTab";
import CRMFieldsTab from "@/components/settings/CRMFieldsTab";
import PaymentMethodsTab from "@/components/settings/PaymentMethodsTab";
import UserRolesManager from "@/components/settings/UserRolesManager";
import CustomRolesTab from "@/components/settings/CustomRolesTab";
import OrganizationPage from "@/pages/OrganizationPage";
import AIContextTab from "@/components/settings/AIContextTab";
import { useUserRole } from "@/hooks/useUserRole";
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
          <div className="flex gap-2 border-b border-neutral-200 mb-4">
            <button className="px-4 py-2 font-medium transition-colors border-b-2 border-transparent hover:text-primary-600"><Users className="w-4 h-4" /> Usuários</button>
            <button className="px-4 py-2 font-medium transition-colors border-b-2 border-transparent hover:text-primary-600"><ClipboardList className="w-4 h-4" /> Campos do CRM</button>
            <button className="px-4 py-2 font-medium transition-colors border-b-2 border-transparent hover:text-primary-600"><CreditCard className="w-4 h-4" /> Pagamento</button>
            {canAccessSettings && <button className="px-4 py-2 font-medium transition-colors border-b-2 border-transparent hover:text-primary-600"><Shield className="w-4 h-4" /> Roles</button>}
            {canAccessSettings && <button className="px-4 py-2 font-medium transition-colors border-b-2 border-transparent hover:text-primary-600"><Lock className="w-4 h-4" /> Permissões</button>}
            {canAccessSettings && <button className="px-4 py-2 font-medium transition-colors border-b-2 border-transparent hover:text-primary-600"><Building2 className="w-4 h-4" /> Organização</button>}
            {canAccessSettings && <button className="px-4 py-2 font-medium transition-colors border-b-2 border-transparent hover:text-primary-600"><Brain className="w-4 h-4" /> Contexto IA</button>}
          </div>
        </div>

        <Card variant="elevated" padding="lg">
          <div><UsersTab /></div>
          <div><CRMFieldsTab /></div>
          <div><PaymentMethodsTab /></div>
          {canAccessSettings && <div><CustomRolesTab onRoleCreated={handleRoleCreated} /></div>}
          {canAccessSettings && <div><UserRolesManager preselectedRole={preselectedRole} /></div>}
          {canAccessSettings && <div><OrganizationPage /></div>}
          {canAccessSettings && <div><AIContextTab /></div>}
        </Card>
      </Tabs>
    </div>
  );
}
