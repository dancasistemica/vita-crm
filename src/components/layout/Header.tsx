import React from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button, SidebarTrigger } from '@/components/ui/ds';

interface HeaderProps {
  title?: string;
  onOpenSidebar?: () => void;
}

export function Header({ title, onOpenSidebar }: HeaderProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-20">
      <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20 px-4 sm:px-6 lg:px-8">
        {/* Sidebar Trigger - Handles both Shadcn Sidebar and Custom DashboardLayout Sidebar */}
        <div className="flex items-center gap-4">
          {onOpenSidebar ? (
            <button
              onClick={onOpenSidebar}
              className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6 text-neutral-600" />
            </button>
          ) : (
            <SidebarTrigger />
          )}
          
          {/* Page Title */}
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900 truncate">
            {title || 'Dashboard'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Logout Button - Desktop */}
          <Button
            variant="secondary"
            onClick={handleLogout}
            className="hidden sm:flex items-center gap-2 min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sair</span>
          </Button>

          {/* Logout Button - Mobile */}
          <button
            onClick={handleLogout}
            className="sm:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Sair"
          >
            <LogOut className="w-5 h-5 text-neutral-600" />
          </button>
        </div>
      </div>
    </header>
  );
}
