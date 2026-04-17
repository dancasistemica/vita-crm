import { Outlet, useLocation } from "react-router-dom";
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
    "/database": "Estrutura do Banco",
  };

  const getPageTitle = () => {
    if (location.pathname.startsWith("/clientes/")) return "Detalhes do Cliente";
    return pageTitles[location.pathname] || "CRM";
  };

  return (
    <>
      <AppSidebar />
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-auto bg-neutral-50 p-3 sm:p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </>
  );
}