import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, TrendingUp, Settings, X, ChevronDown, LogOut, PanelLeftClose, PanelLeftOpen, ClipboardCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBrand } from '@/contexts/BrandContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface Organization {
  id: string;
  name: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: ClipboardCheck, label: 'Presença', path: '/presenca' },
  { icon: TrendingUp, label: 'Leads', path: '/leads' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
];

export function Sidebar({ onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { brand } = useBrand();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserAndOrgs = async () => {
      try {
        console.log('[Sidebar] Carregando perfil do usuário e organizações...');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('[Sidebar] Usuário não autenticado');
          return;
        }

        // Carregar perfil do usuário do banco
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setUserProfile({
            id: profile.id,
            email: user.email || '',
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
          });
        } else {
          // Fallback para dados do auth
          setUserProfile({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name,
          });
        }

        // Verificar se é SuperAdmin
        const { data: superAdminData } = await supabase
          .from('superadmin_roles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        const isSA = !!superAdminData;
        setIsSuperAdmin(isSA);

        if (isSA) {
          // Carregar todas as organizações para SuperAdmin
          console.log('[Sidebar] Carregando organizações para SuperAdmin...');
          const { data: orgs, error } = await supabase
            .from('organizations')
            .select('id, name')
            .order('name');

          if (error) {
            console.error('[Sidebar] Erro ao carregar organizações:', error);
          } else {
            setOrganizations(orgs || []);
            const lastOrg = localStorage.getItem('superadmin_current_org');
            if (lastOrg && orgs?.some(o => o.id === lastOrg)) {
              setSelectedOrg(lastOrg);
            } else if (orgs && orgs.length > 0) {
              setSelectedOrg(orgs[0].id);
            }
          }
        } else {
          // Carregar organização do usuário normal via organization_members
          console.log('[Sidebar] Carregando organização do usuário...');
          const { data: memberData } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (memberData?.organization_id) {
            const { data: org } = await supabase
              .from('organizations')
              .select('id, name')
              .eq('id', memberData.organization_id)
              .maybeSingle();

            if (org) {
              setOrganizations([org]);
              setSelectedOrg(org.id);
            }
          }
        }
      } catch (err) {
        console.error('[Sidebar] Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserAndOrgs();
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleOrgChange = (orgId: string) => {
    console.log('[Sidebar] Mudando organização para:', orgId);
    setSelectedOrg(orgId);
    localStorage.setItem('superadmin_current_org', orgId);
    setShowOrgDropdown(false);
    window.location.reload(); // Refresh to apply brand context
  };

  const handleLogout = async () => {
    console.log('[Sidebar] Fazendo logout...');
    await supabase.auth.signOut();
    navigate('/login');
  };

  const selectedOrgName = organizations.find(org => org.id === selectedOrg)?.name || 'Selecionar Organização';
  const userInitials = userProfile?.full_name
    ? userProfile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : userProfile?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className={cn("flex flex-col h-full bg-sidebar transition-all duration-300", collapsed ? "w-20" : "w-64")}>
      {/* Header Mobile Only */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border lg:hidden">
        <h2 className="text-lg font-bold text-sidebar-foreground">Menu</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5 text-sidebar-foreground" />
        </button>
      </div>

      {/* Logo/Brand - Desktop Only */}
      <div className={cn("hidden lg:flex items-center p-6 border-b border-sidebar-border h-20 shrink-0 transition-all", collapsed ? "justify-center px-4" : "justify-between")}>
        <div className="flex items-center gap-3 overflow-hidden">
          {brand.logo_url ? (
            <img 
              src={brand.logo_url} 
              alt={brand.org_display_name || 'Logo'} 
              className="brand-logo object-contain shrink-0"
              style={{ height: 'var(--logo-h-desktop, 32px)' }}
            />
          ) : (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm">
                {(brand.org_display_name || 'V').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-foreground truncate animate-in fade-in duration-300">
              {brand.org_display_name || 'VITA CRM'}
            </span>
          )}
        </div>
      </div>

      {/* Select Organizações - SuperAdmin Only */}
      {isSuperAdmin && organizations.length > 0 && !collapsed && (
        <div className="p-4 sm:p-6 border-b border-sidebar-border animate-in fade-in duration-300">
          <label className="block text-xs sm:text-sm font-medium text-sidebar-foreground/70 mb-2">
            Organização
          </label>
          <div className="relative">
            <button
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border border-sidebar-border rounded-lg hover:bg-sidebar-accent transition-colors min-h-[44px] text-sm text-sidebar-foreground"
            >
              <span className="font-medium truncate">
                {selectedOrgName}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-sidebar-foreground/70 flex-shrink-0 transition-transform ${
                  showOrgDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {showOrgDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-sidebar border border-sidebar-border rounded-lg shadow-lg z-50 overflow-hidden">
                <ul className="max-h-48 overflow-y-auto">
                  {organizations.map((org) => (
                    <li key={org.id}>
                      <button
                        onClick={() => handleOrgChange(org.id)}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-sidebar-accent transition-colors ${
                          selectedOrg === org.id
                            ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
                            : 'text-sidebar-foreground'
                        }`}
                      >
                        {org.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group min-h-[44px]",
                isActive
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                collapsed && "justify-center px-0"
              )}
            >
              <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6 shrink-0 transition-transform group-hover:scale-110", isActive && "text-primary")} />
              {!collapsed && (
                <span className="text-sm sm:text-base font-medium truncate animate-in fade-in slide-in-from-left-2 duration-300">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Perfil do Usuário */}
      <div className={cn("p-4 border-t border-sidebar-border transition-all", collapsed && "p-2")}>
        {!loading && userProfile && (
          <div className={cn("flex items-center gap-3 mb-4", collapsed && "flex-col items-center mb-0 gap-2")}>
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground font-bold overflow-hidden shrink-0 border border-sidebar-border">
              {userProfile.avatar_url ? (
                <img src={userProfile.avatar_url} alt={userProfile.full_name} className="w-full h-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
            {!collapsed ? (
              <>
                <div className="flex-1 min-w-0 animate-in fade-in duration-300">
                  <p className="text-sm font-semibold text-sidebar-foreground truncate">
                    {userProfile.full_name || 'Usuário'}
                  </p>
                  <p className="text-xs text-sidebar-foreground/50 truncate">
                    {userProfile.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors shrink-0 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  aria-label="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground"
                aria-label="Sair"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        {!collapsed && (
          <p className="text-[10px] text-sidebar-foreground/30 text-center uppercase tracking-widest mt-2">
            © 2026 {brand.org_display_name || 'VITA CRM'}
          </p>
        )}
      </div>
    </div>
  );
}
