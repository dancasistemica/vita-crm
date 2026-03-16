import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { useBrand } from "@/contexts/BrandContext";

export default function CRMLayout() {
  const { brand } = useBrand();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/60 px-4 bg-card shadow-card sticky top-0 z-30">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-green-600 to-purple-600 md:hidden">
                <span className="text-white font-bold text-xs">R</span>
              </div>
              <h2 className="text-lg font-semibold text-foreground font-display">
                {brand.org_display_name || 'RAIZ'}
              </h2>
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
