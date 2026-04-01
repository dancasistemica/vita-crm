import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, TrendingUp, Settings, X } from 'lucide-react';

interface SidebarProps {
  onClose: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: TrendingUp, label: 'Leads', path: '/leads' },
  { icon: Settings, label: 'Configurações', path: '/settings' },
];

export function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-200 lg:hidden">
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
        <h1 className="text-xl font-bold text-primary-600">Dança Sistêmica</h1>
      </div>

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

      {/* Footer */}
      <div className="p-4 sm:p-6 border-t border-neutral-200">
        <p className="text-xs sm:text-sm text-neutral-500 text-center">
          © 2026 Dança Sistêmica
        </p>
      </div>
    </div>
  );
}
