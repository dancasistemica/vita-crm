import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/ds";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/layout/Header";

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
    <SidebarProvider>
      <AppSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header title={getPageTitle()} />
        <main className="flex-1 overflow-auto bg-neutral-50 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
