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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-neutral-200">
            <div className="flex items-center gap-3 min-w-fit">
              <HeaderMenu />
              <div className="hidden sm:flex flex-col">
                <span className="text-xs text-neutral-500 uppercase tracking-wide">Organização</span>
                <span className="text-sm font-semibold text-neutral-900">{organizationName}</span>
              </div>
            </div>
            {isDashboard ? (
              <div className="relative flex-1 max-w-md mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Buscar leads, clientes, tarefas..."
                    className="pl-10 pr-4 py-2 w-full rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    autoComplete="off"
                  />
                </div>

                {searchQuery && results.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
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
                        className="w-full text-left px-4 py-2 hover:bg-neutral-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        type="button"
                      >
                        <p className="text-sm font-medium text-neutral-900">{result.title}</p>
                        {result.subtitle && (
                          <p className="text-xs text-neutral-500">{result.subtitle}</p>
                        )}
                        <span className="text-xs text-neutral-400 capitalize">{result.type}</span>
                      </Button>
                    ))}
                  </div>
                )}

                {searchQuery && results.length === 0 && !loading && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 p-4 text-center">
                    <p className="text-sm text-neutral-500">Nenhum resultado encontrado</p>
                  </div>
                )}

                {loading && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 p-4 text-center">
                    <p className="text-sm text-neutral-500">Buscando...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1" />
            )}
            <Link to="/" className="flex items-center gap-3 min-w-fit" aria-label="VITA CRM">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-400 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="text-sm font-semibold text-neutral-900 hidden sm:inline">ita CRM</span>
            </Link>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-6">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
