import { Button, Input, SidebarProvider, useSidebar } from "@/components/ui/ds";
import { AppSidebar } from "@/components/AppSidebar";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useBrand } from "@/contexts/BrandContext";
import { useOrganizationSwitch } from "@/hooks/useOrganizationSwitch";
import { useSearch } from "@/hooks/useSearch";
import { Menu, Search } from "lucide-react";

function HeaderMenu() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleSidebar}
      className="h-9 w-9"
      aria-label="Alternar sidebar"
      type="button"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}

export default function CRMLayout() {
  const { brand } = useBrand();
  const { currentOrganization } = useOrganizationSwitch();
  const { searchQuery, setSearchQuery, results, loading } = useSearch();
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === "/";
  const organizationName = currentOrganization?.name || brand.org_display_name || "CRM";

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
      <div className="min-h-screen flex w-full relative bg-neutral-50/50">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-2 px-3 py-2 md:px-4 md:py-3 bg-white/90 backdrop-blur-md border-b border-neutral-200 shadow-sm transition-all">
            <div className="flex items-center gap-2 md:gap-3 min-w-fit">
              <HeaderMenu />
              <div className="flex flex-col">
                <span className="text-[10px] md:text-xs text-neutral-500 uppercase tracking-wide font-medium">
                  {isDashboard ? "CRM" : getPageTitle()}
                </span>
                <span className="text-xs md:text-sm font-bold text-neutral-900 truncate max-w-[120px] md:max-w-none">
                  {organizationName}
                </span>
              </div>
            </div>

            {isDashboard ? (
              <div className="relative flex-1 max-w-md mx-auto hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Buscar..."
                    className="pl-10 pr-4 py-2 w-full rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm bg-neutral-50"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    autoComplete="off"
                  />
                </div>
                {searchQuery && results.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {results.map((result) => (
                      <Button variant="secondary" size="sm"
                        key={`${result.type}-${result.id}`}
                        onClick={() => {
                          if (result.type === "lead") {
                            navigate("/leads", { state: { leadId: result.id } });
                          } else if (result.type === "client") {
                            navigate(`/clientes/${result.id}`);
                          } else if (result.type === "task") {
                            navigate("/tarefas", { state: { taskId: result.id } });
                          }
                          setSearchQuery("");
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0 transition-colors flex flex-col items-start gap-0.5"
                        type="button"
                      >
                        <div className="flex items-center justify-between w-full">
                          <p className="text-sm font-semibold text-neutral-900">{result.title}</p>
                          <span className="text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-full capitalize">{result.type}</span>
                        </div>
                        {result.subtitle && (
                          <p className="text-xs text-neutral-500">{result.subtitle}</p>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 hidden md:block" />
            )}

            <div className="flex items-center gap-2 md:gap-3">
              {isDashboard && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="md:hidden h-8 w-8 p-0" 
                  onClick={() => {/* Toggle mobile search - could add a state for this later */}}
                >
                  <Search className="h-4 w-4 text-neutral-500" />
                </Button>
              )}
              <Link to="/" className="flex items-center gap-2 min-w-fit" aria-label="VITA CRM">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-sm">V</span>
                </div>
                <span className="text-sm font-bold text-neutral-900 hidden sm:inline tracking-tight">ita CRM</span>
              </Link>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-3 md:p-6 lg:p-8">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
