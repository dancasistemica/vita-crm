import { useMemo, useState } from "react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Link, Outlet } from "react-router-dom";
import { useBrand } from "@/contexts/BrandContext";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useOrganizationSwitch } from "@/hooks/useOrganizationSwitch";
import { CONSOLIDATED_ORG_ID } from "@/contexts/OrganizationContext";
import { Building2, Check, ChevronDown, Globe, Menu, Search } from "lucide-react";

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
  const { organizations, currentOrganization, currentOrgId, isSuperadmin, loading, switchOrganization } =
    useOrganizationSwitch();
  const [orgOpen, setOrgOpen] = useState(false);
  const [orgQuery, setOrgQuery] = useState("");

  const organizationName = currentOrganization?.name || brand.org_display_name || "CRM";
  const isConsolidated = currentOrgId === CONSOLIDATED_ORG_ID;
  const filteredOrganizations = useMemo(() => {
    const query = orgQuery.trim().toLowerCase();
    if (!query) {
      return organizations;
    }

    return organizations.filter((org) => {
      return (
        org.name.toLowerCase().includes(query) ||
        (org.description?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [organizations, orgQuery]);

  const handleSelectOrganization = async (orgId: string) => {
    await switchOrganization(orgId);
    setOrgOpen(false);
    setOrgQuery("");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between gap-4 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
            <div className="flex items-center gap-3 min-w-fit">
              <HeaderMenuButton />
              <div className="hidden sm:flex flex-col">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Organização</span>
                {isSuperadmin && !loading ? (
                  <Popover open={orgOpen} onOpenChange={(open) => {
                    setOrgOpen(open);
                    if (!open) {
                      setOrgQuery("");
                    }
                  }}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                        aria-label="Selecionar organização"
                      >
                        <span className="max-w-[180px] truncate">{organizationName}</span>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-80 p-0">
                      <div className="border-b border-gray-200 p-3">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            value={orgQuery}
                            onChange={(event) => setOrgQuery(event.target.value)}
                            placeholder="Buscar organização..."
                            aria-label="Buscar organização"
                            className="pl-8"
                          />
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto py-1">
                        <button
                          type="button"
                          onClick={() => handleSelectOrganization(CONSOLIDATED_ORG_ID)}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                            isConsolidated ? "bg-gray-100" : ""
                          }`}
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50">
                            <Globe className="h-4 w-4 text-blue-600" />
                          </span>
                          <span className="flex-1 truncate">🌐 Consolidado</span>
                          {isConsolidated && <Check className="h-4 w-4 text-blue-600" />}
                        </button>
                        {filteredOrganizations.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-gray-500">Nenhuma organização encontrada</p>
                        ) : (
                          filteredOrganizations.map((org) => {
                            const isActive = currentOrgId === org.id;
                            return (
                              <button
                                key={org.id}
                                type="button"
                                onClick={() => handleSelectOrganization(org.id)}
                                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                                  isActive ? "bg-gray-100" : ""
                                }`}
                              >
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                                  <Building2 className="h-4 w-4 text-gray-500" />
                                </span>
                                <span className="flex-1 min-w-0">
                                  <span className="block truncate font-medium text-gray-900">{org.name}</span>
                                  {org.description && (
                                    <span className="block truncate text-xs text-gray-500">
                                      {org.description}
                                    </span>
                                  )}
                                </span>
                                {isActive && <Check className="h-4 w-4 text-blue-600" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <span className="text-sm font-semibold text-gray-900">{organizationName}</span>
                )}
              </div>
            </div>

            <div className="flex-1 max-w-md mx-auto">
              <GlobalSearch />
            </div>

            <Link
              to="/"
              className="flex items-center gap-2 min-w-fit"
              aria-label="Vita CRM"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                role="img"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="vitaLogoGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
                <rect width="24" height="24" rx="4" fill="url(#vitaLogoGradient)" />
                <path
                  d="M6.5 6.5h2.6l2.9 6.8 2.9-6.8h2.6l-4.8 11h-1.4l-4.8-11z"
                  fill="#ffffff"
                />
              </svg>
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
