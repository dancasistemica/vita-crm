import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { supabase, secureLogout } from '@/lib/supabase';
import { Button } from '@/components/ui/ds';
import { GlobalSearch } from './GlobalSearch';
import { useBrand } from '@/contexts/BrandContext';
import { useSidebar } from '@/components/ui/ds/Sidebar';

interface HeaderProps {
  onOpenSidebar?: () => void;
  sidebarOpen?: boolean;
  title?: string;
}

export function Header({ onOpenSidebar: onMenuClick, sidebarOpen: menuOpen }: HeaderProps) {
  const navigate = useNavigate();
  const { brand } = useBrand();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Try to get sidebar context if available (used in CRMLayout)
  let sidebarContext;
  try {
    sidebarContext = useSidebar();
  } catch (e) {
    // Not in a SidebarProvider context
  }

  const handleLogout = async () => {
    try {
      await secureLogout();
    } catch (err) {
      console.error('[Header] Erro ao sair:', err);
      navigate('/login');
    }
  };

  const finalMenuClick = onMenuClick || (() => {
    if (sidebarContext) {
      sidebarContext.setOpen(true);
    }
  });

  return (
    <header className="bg-background border-b border-border sticky top-0 z-20 w-full overflow-hidden">
      <div className="h-16 sm:h-18 lg:h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        
        {/* SEÇÃO 1: Hamburger + Nome da Organização (Esquerda) */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Hamburger Menu - Mobile Only */}
          <button
            onClick={finalMenuClick}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
          </button>

          {/* Nome da Organização */}
          <div className="hidden sm:block min-w-0">
            <p className="text-xs lg:text-sm font-medium text-muted-foreground truncate">
              ORGANIZAÇÃO
            </p>
            <p className="text-sm lg:text-base font-bold text-foreground truncate">
              {brand.org_display_name || 'Sistema'}
            </p>
          </div>

          {/* Nome da Organização - Mobile */}
          <div className="sm:hidden min-w-0">
            <p className="text-xs font-bold text-foreground truncate">
              {(brand.org_display_name || 'Sistema').split(' ')[0]}
            </p>
          </div>
        </div>

        {/* SEÇÃO 2: Campo de Busca Global (Centro) */}
        <div className="flex-1 max-w-md hidden sm:block">
          <GlobalSearch />
        </div>

        {/* SEÇÃO 3: Logo + Logout (Direita) */}
        <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
          {/* Logo - Desktop */}
          <div className="hidden sm:flex items-center gap-2">
            {brand.logo_url ? (
              <img 
                src={brand.logo_url} 
                alt="Logo" 
                className="brand-logo object-contain"
                style={{ height: 'var(--logo-h-desktop, 40px)' }}
              />
            ) : (
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-bold text-sm lg:text-base">
                  {(brand.org_display_name || 'V').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm lg:text-base font-bold text-primary hidden lg:inline">
              {brand.org_display_name?.split(' ')[0] || 'VITA'}
            </span>
          </div>

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
            className="sm:hidden p-2 hover:bg-muted rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Sair"
          >
            <LogOut className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Busca Global - Mobile */}
      <div className="sm:hidden px-4 py-3 border-t border-border">
        <GlobalSearch />
      </div>
    </header>
  );
}
