import React from 'react';
import { Menu, X, LogOut, PanelLeftOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button, SidebarTrigger } from '@/components/ui/ds';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-20">
      <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20 px-4 sm:px-6 lg:px-8">
        {/* Sidebar Trigger */}
        <div className="flex items-center">
          <SidebarTrigger />
        </div>

        {/* Page Title */}
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-neutral-900 flex-1 ml-4 lg:ml-0">
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
          className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Sair"
        >
          <LogOut className="w-5 h-5 text-neutral-600" />
        </button>
      </div>
    </header>
  );
}
