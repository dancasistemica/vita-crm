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
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">Configurações</h1>
        <p className="text-sm text-neutral-600 mt-1">Gerencie usuários, permissões e parâmetros do sistema</p>
      </div>

      <div className="w-full space-y-4">
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-2 border-b border-neutral-200">
            {[
              { id: 'usuarios', label: 'Usuários', icon: Users },
              { id: 'crm', label: 'Campos do CRM', icon: ClipboardList },
              { id: 'pagamento', label: 'Pagamento', icon: CreditCard },
              ...(canAccessSettings ? [
                { id: 'roles', label: 'Roles', icon: Shield },
                { id: 'permissoes', label: 'Permissões', icon: Lock },
                { id: 'organizacao', label: 'Organização', icon: Building2 },
                { id: 'ai', label: 'Contexto IA', icon: Brain }
              ] : [])
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tab.id !== "permissoes") setPreselectedRole(null); }}
                className={`px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'border-primary-600 text-primary-600' 
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <Card variant="elevated" padding="lg">
          {activeTab === 'usuarios' && <UsersTab />}
          {activeTab === 'crm' && <CRMFieldsTab />}
          {activeTab === 'pagamento' && <PaymentMethodsTab />}
          {canAccessSettings && activeTab === 'roles' && <CustomRolesTab onRoleCreated={handleRoleCreated} />}
          {canAccessSettings && activeTab === 'permissoes' && <UserRolesManager preselectedRole={preselectedRole} />}
          {canAccessSettings && activeTab === 'organizacao' && <OrganizationPage />}
          {canAccessSettings && activeTab === 'ai' && <AIContextTab />}
        </Card>
      </div>
    </div>
  );
}
