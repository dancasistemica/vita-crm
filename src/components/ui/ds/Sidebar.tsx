import React, { createContext, useContext, useState } from 'react';

const SidebarContext = createContext<any>(null);

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(true);
  return (
    <SidebarContext.Provider value={{ open, setOpen, isMobile: false }}>
      <div className="flex min-h-screen w-full bg-neutral-50">
        {children}
      </div>
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);

export const Sidebar = ({ children }: { children: React.ReactNode }) => {
  const { open } = useSidebar();
  return (
    <aside className={`bg-white border-r border-neutral-200 transition-all duration-300 ${open ? 'w-64' : 'w-20'}`}>
      {children}
    </aside>
  );
};

export const SidebarContent = ({ children }: { children: React.ReactNode }) => <div className="p-4">{children}</div>;
export const SidebarGroup = ({ children }: { children: React.ReactNode }) => <div className="mb-6">{children}</div>;
export const SidebarGroupLabel = ({ children }: { children: React.ReactNode }) => <div className="px-2 mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">{children}</div>;
export const SidebarGroupContent = ({ children }: { children: React.ReactNode }) => <div className="space-y-1">{children}</div>;
export const SidebarMenu = ({ children }: { children: React.ReactNode }) => <nav className="space-y-1">{children}</nav>;
export const SidebarMenuItem = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const SidebarMenu = ({ children, active, onClick, className = '', asChild }: any) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
      ${active ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:bg-neutral-100'}
      ${className}
    `}
  >
    {children}
  </button>
);
export const SidebarFooter = ({ children }: { children: React.ReactNode }) => <div className="mt-auto p-4 border-t border-neutral-100">{children}</div>;
export const SidebarTrigger = () => {
  const { setOpen } = useSidebar();
  return (
    <button onClick={() => setOpen((o: boolean) => !o)} className="p-2 hover:bg-neutral-100 rounded-lg">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
    </button>
  );
};
