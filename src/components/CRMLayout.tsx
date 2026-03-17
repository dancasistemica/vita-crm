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
          <header
            style={{ minHeight: brand.logo_size > 48 ? `${brand.logo_size + 16}px` : undefined }}
            className="min-h-[56px] flex items-center justify-between border-b border-border/60 px-4 bg-card shadow-card sticky top-0 z-30 transition-all duration-200"
          >
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              <h2 className="text-lg font-semibold text-foreground font-display">
                {brand.org_display_name || 'CRM'}
              </h2>
            </div>
            {brand.logo_url && (
              <img
                src={brand.logo_url}
                alt="Logo"
                style={{ height: `${brand.logo_size}px`, opacity: 0 }}
                className="w-auto max-w-[160px] md:max-w-[280px] max-h-[80px] md:max-h-none object-contain transition-all duration-300"
                onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1'; }}
              />
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
