import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/ds';

interface HeaderProps {
  onOpenSidebar: () => void;
  sidebarOpen?: boolean;
  title?: string;
}

export function Header({ onOpenSidebar: onMenuClick, sidebarOpen: menuOpen }: HeaderProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [organizationName, setOrganizationName] = useState('Dança Sistêmica');

  React.useEffect(() => {
    const loadOrganization = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Using organization_members to match project schema
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (membership?.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', membership.organization_id)
            .single();

          if (org) {
            setOrganizationName(org.name);
          }
        }
      } catch (err) {
        console.error('[Header] Erro ao carregar organização:', err);
      }
    };

    loadOrganization();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('[Header] Buscando:', searchQuery);
      // Global search logic implementation placeholder
      // navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-20">
      <div className="h-16 sm:h-18 lg:h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        
        {/* SEÇÃO 1: Hamburger + Nome da Organização (Esquerda) */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Hamburger Menu - Mobile Only */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
            aria-label="Menu"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Nome da Organização */}
          <div className="hidden sm:block min-w-0">
            <p className="text-xs lg:text-sm font-medium text-neutral-500 truncate">
              ORGANIZAÇÃO
            </p>
            <p className="text-sm lg:text-base font-bold text-neutral-900 truncate">
              {organizationName}
            </p>
          </div>

          {/* Nome da Organização - Mobile */}
          <div className="sm:hidden min-w-0">
            <p className="text-xs font-bold text-neutral-900 truncate">
              {organizationName.split(' ')[0]}
            </p>
          </div>
        </div>

        {/* SEÇÃO 2: Campo de Busca Global (Centro) */}
        <form 
          onSubmit={handleSearch}
          className="flex-1 max-w-md hidden sm:block"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Buscar leads, clientes, tarefas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 lg:py-3 text-sm lg:text-base border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors min-h-[44px]"
            />
          </div>
        </form>

        {/* SEÇÃO 3: Logo VITA + Logout (Direita) */}
        <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
          {/* Logo VITA - Desktop */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm lg:text-base">V</span>
            </div>
            <span className="text-sm lg:text-base font-bold text-primary-600 hidden lg:inline">
              VITA
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
            className="sm:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Sair"
          >
            <LogOut className="w-5 h-5 text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Busca Global - Mobile */}
      <form 
        onSubmit={handleSearch}
        className="sm:hidden px-4 py-3 border-t border-neutral-200"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors min-h-[44px]"
          />
        </div>
      </form>
    </header>
  );
}
