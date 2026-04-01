import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, TrendingUp, Settings, X, ChevronDown, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SidebarProps {
  onClose: () => void;
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
  { icon: TrendingUp, label: 'Leads', path: '/leads' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
];

export function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
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
            if (orgs && orgs.length > 0) {
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
    setShowOrgDropdown(false);
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
    <div className="flex flex-col h-full bg-white">
      {/* Header Mobile Only */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 lg:hidden">
        <h2 className="text-lg font-bold text-neutral-900">Menu</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5 text-neutral-600" />
        </button>
      </div>

      {/* Logo/Brand - Desktop Only */}
      <div className="hidden lg:flex items-center justify-center p-6 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-base">DS</span>
          </div>
          <span className="text-xl font-bold text-neutral-900">Dança Sistêmica</span>
        </div>
      </div>

      {/* Select Organizações - SuperAdmin Only */}
      {isSuperAdmin && organizations.length > 0 && (
        <div className="p-4 sm:p-6 border-b border-neutral-200">
          <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
            Organização
          </label>
          <div className="relative">
            <button
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors min-h-[44px] text-sm"
            >
              <span className="text-neutral-900 font-medium truncate">
                {selectedOrgName}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-neutral-600 flex-shrink-0 transition-transform ${
                  showOrgDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {showOrgDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-300 rounded-lg shadow-lg z-50">
                <ul className="max-h-48 overflow-y-auto">
                  {organizations.map((org) => (
                    <li key={org.id}>
                      <button
                        onClick={() => handleOrgChange(org.id)}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-neutral-100 transition-colors ${
                          selectedOrg === org.id
                            ? 'bg-primary-50 text-primary-600 font-medium'
                            : 'text-neutral-900'
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
      <nav className="flex-1 overflow-y-auto p-4 sm:p-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <button
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px] text-sm sm:text-base font-medium ${
                    isActive
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Perfil do Usuário */}
      <div className="p-4 sm:p-6 border-t border-neutral-200">
        {!loading && userProfile && (
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold overflow-hidden shrink-0">
              {userProfile.avatar_url ? (
                <img src={userProfile.avatar_url} alt={userProfile.full_name} className="w-full h-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">
                {userProfile.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {userProfile.email}
              </p>
            </div>
          </div>
        )}
        <p className="text-xs text-neutral-500 text-center">
          © 2026 Dança Sistêmica
        </p>
      </div>
    </div>
  );
}
