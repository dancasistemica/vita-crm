import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { useBrand } from "@/contexts/BrandContext";
import { GlobalSearch } from "@/components/layout/GlobalSearch";

export default function CRMLayout() {
  const { brand } = useBrand();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header
            className="min-h-[56px] flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 bg-card shadow-card sticky top-0 z-30 transition-all duration-200"
          >
            <div className="flex items-center order-1">
              <SidebarTrigger className="mr-4" />
              <h2 className="text-lg font-semibold text-foreground font-display">
                {brand.org_display_name || 'CRM'}
              </h2>
            </div>
            <div className="order-3 w-full sm:order-none sm:flex-1 sm:px-6">
              <GlobalSearch />
            </div>
            {brand.logo_url && (
              <div className="order-2 sm:order-none">
                <img
                  src={brand.logo_url}
                  alt="Logo"
                  style={{ opacity: 0 }}
                  className="brand-logo w-auto max-w-[160px] md:max-w-[280px] object-contain transition-all duration-300"
                  onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                />
              </div>
            )}
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
