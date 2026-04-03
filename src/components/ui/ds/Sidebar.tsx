import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext<any>(null);

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // Changed from 1024 to 768 for standard mobile breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setOpen(false);
      } else {
        setOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => setOpen(!open);

  return (
    <SidebarContext.Provider value={{ open, setOpen, isMobile, toggleSidebar }}>
      <div className="flex min-h-screen w-full bg-neutral-50 relative min-w-0">
        {children}
      </div>
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const { open, isMobile, setOpen } = useSidebar();
  
  return (
    <>
      {isMobile && open && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300" 
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`
        bg-white border-r border-neutral-200 transition-all duration-300 z-[101]
        ${isMobile ? 'fixed inset-y-0 left-0 shadow-2xl' : 'relative'}
        ${open ? 'translate-x-0 w-64' : (isMobile ? '-translate-x-full w-0' : 'w-20')}
      `}>
        <div className={isMobile ? 'w-64 h-full bg-white' : 'w-full h-full'}>
          {children}
        </div>
      </aside>
    </>
  );
};

export const SidebarContent = ({ children }: { children: React.ReactNode }) => <div className="p-4 h-full overflow-y-auto bg-white">{children}</div>;
export const SidebarGroup = ({ children }: { children: React.ReactNode }) => <div className="mb-6">{children}</div>;
export const SidebarGroupLabel = ({ children }: { children: React.ReactNode }) => <div className="px-2 mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">{children}</div>;
export const SidebarGroupContent = ({ children }: { children: React.ReactNode }) => <div className="space-y-1">{children}</div>;
export const SidebarMenu = ({ children }: { children: React.ReactNode }) => <nav className="space-y-1">{children}</nav>;
export const SidebarMenuItem = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const SidebarMenuButton = ({ children, active, onClick, className = '', asChild }: any) => (
  <div
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
      ${active ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-100'}
      ${className}
    `}
  >
    {children}
  </div>
);
export const SidebarFooter = ({ children }: { children: React.ReactNode }) => <div className="mt-auto p-4 border-t border-neutral-100 bg-white">{children}</div>;
export const SidebarTrigger = () => {
  const { toggleSidebar } = useSidebar();
  return (
    <button onClick={toggleSidebar} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
    </button>
  );
};
