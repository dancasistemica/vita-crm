import React from 'react';
import { Menu, X, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/ds';

interface HeaderProps {
  title?: string;
  onOpenSidebar: () => void;
  sidebarOpen?: boolean;
}

export function Header({ title, onOpenSidebar, sidebarOpen }: HeaderProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-20">
      <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20 px-4 sm:px-6 lg:px-8">
        {/* Logo + Hamburger - Mobile */}
        <div className="flex items-center gap-4">
          {/* Hamburger Menu - Mobile Only */}
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Menu"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-600" />
            ) : (
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-600" />
            )}
          </button>

          {/* Logo - Mobile Only */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm sm:text-base">DS</span>
            </div>
            <span className="text-sm sm:text-base font-bold text-neutral-900 hidden sm:inline">
              Dança Sistêmica
            </span>
          </div>
        </div>

        {/* Page Title - Desktop */}
        <h1 className="hidden lg:block text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900 flex-1">
          {title || 'Dashboard'}
        </h1>

        {/* Page Title - Mobile */}
        <h1 className="lg:hidden text-base sm:text-lg font-bold text-neutral-900 flex-1 ml-2">
          {title || 'Dashboard'}
        </h1>

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
    </header>
  );
}
