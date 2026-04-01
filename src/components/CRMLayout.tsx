import { Outlet, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export default function CRMLayout() {
  const location = useLocation();
  const pageTitles: Record<string, string> = {
    "/": "Dashboard",
    "/leads": "Leads",
    "/pipeline": "Funil de Vendas",
    "/vendas": "Vendas",
    "/clientes": "Clientes",
    "/interacoes": "Interações",
    "/tarefas": "Tarefas",
    "/produtos": "Produtos",
    "/relatorios": "Relatórios",
    "/configuracoes": "Configurações",
    "/personalizar": "Personalizar",
    "/perfil": "Meu Perfil",
    "/superadmin": "Superadmin",
    "/admin/users": "Usuários",
    "/debug": "Debug",
    "/import-wizard": "Importar Leads",
  };

  const getPageTitle = () => {
    if (location.pathname.startsWith("/clientes/")) return "Detalhes do Cliente";
    return pageTitles[location.pathname] || "CRM";
  };

  return (
    <DashboardLayout title={getPageTitle()}>
      <Outlet />
    </DashboardLayout>
  );
}
