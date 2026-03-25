import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { useBrand } from "@/contexts/BrandContext";
import { Button } from "@/components/ui/button";
import { useOrganizationSwitch } from "@/hooks/useOrganizationSwitch";
import { Menu } from "lucide-react";

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
  const organizationName = currentOrganization?.name || brand.org_display_name || "CRM";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
            <HeaderMenuButton />
            <div className="hidden sm:flex flex-col">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Organização</span>
              <span className="text-sm font-semibold text-gray-900">{organizationName}</span>
            </div>
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
