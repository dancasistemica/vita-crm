import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Link, Outlet } from "react-router-dom";
import { useBrand } from "@/contexts/BrandContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrganizationSwitch } from "@/hooks/useOrganizationSwitch";
import { useSearch } from "@/hooks/useSearch";
import { Menu, Search } from "lucide-react";

function HeaderMenuButton() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
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
  const { searchQuery, setSearchQuery, selectedFilter, setSelectedFilter, results, loading } = useSearch();
  const organizationName = currentOrganization?.name || brand.org_display_name || "CRM";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between gap-4 px-4 py-3 bg-white border-b border-gray-200">
            <div className="flex items-center gap-3 min-w-fit">
              <HeaderMenuButton />
              <div className="hidden sm:flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Organização</span>
                <span className="text-sm font-semibold text-gray-900">{organizationName}</span>
              </div>
            </div>
            <div className="relative flex-1 max-w-md mx-auto w-full">
              <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedFilter("all")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedFilter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  type="button"
                >
                  Todos
                </button>
                <button
                  onClick={() => setSelectedFilter("lead")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedFilter === "lead"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  type="button"
                >
                  Leads
                </button>
                <button
                  onClick={() => setSelectedFilter("client")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedFilter === "client"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  type="button"
                >
                  Clientes
                </button>
                <button
                  onClick={() => setSelectedFilter("task")}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedFilter === "task"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  type="button"
                >
                  Tarefas
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Buscar leads, clientes, tarefas..."
                  className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  disabled={false}
                  autoComplete="off"
                />
              </div>

              {searchQuery && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  {["lead", "client", "task"].map((type) => {
                    const typeResults = results.filter((result) => result.type === type);
                    if (typeResults.length === 0) return null;

                    return (
                      <div key={type}>
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                          <p className="text-xs font-semibold text-gray-600 uppercase">
                            {type === "lead" ? "👤 Leads" : type === "client" ? "💼 Clientes" : "✓ Tarefas"}
                          </p>
                        </div>
                        {typeResults.map((result) => (
                          <button
                            key={`${result.type}-${result.id}`}
                            onClick={() => {
                              if (result.type === "lead") {
                                window.location.href = `/leads/${result.id}`;
                              } else if (result.type === "client") {
                                window.location.href = `/clients/${result.id}`;
                              } else if (result.type === "task") {
                                window.location.href = `/tasks/${result.id}`;
                              }
                              setSearchQuery("");
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                            type="button"
                          >
                            <p className="text-sm font-medium text-gray-900">{result.title}</p>
                            {result.subtitle && (
                              <p className="text-xs text-gray-500">{result.subtitle}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {searchQuery && results.length === 0 && !loading && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center">
                  <p className="text-sm text-gray-500">
                    Nenhum resultado encontrado para "{selectedFilter === "all" ? "todos" : selectedFilter}"
                  </p>
                </div>
              )}

              {loading && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center">
                  <p className="text-sm text-gray-500">Buscando...</p>
                </div>
              )}
            </div>
            <Link to="/" className="flex items-center gap-2 min-w-fit" aria-label="VITA CRM">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-400 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 hidden sm:inline">ita CRM</span>
            </Link>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
