import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Columns3, UserCheck, MessageCircle,
  CheckSquare, Package, BarChart3, Settings, LogOut, Shield, User, Palette, ShoppingCart, ClipboardCheck, Calendar, Bell, Plug
} from "lucide-react";

import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { OrganizationSwitcher } from "@/components/OrganizationSwitcher";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage, 
  Separator,
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent,
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarFooter, 
  useSidebar,
  Button,
  Skeleton
} from "@/components/ui/ds";

const baseItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Dashboard Executivo", url: "/dashboard/executivo", icon: BarChart3 },
  { 
    title: "Dashboard Financeiro", 
    url: "/dashboard-financeiro", 
    icon: ({ className }: { className?: string }) => (
      <span className={cn("flex items-center justify-center mr-1", className)} style={{ fontSize: '1rem' }}>💰</span>
    )
  },

  { title: "Leads", url: "/leads", icon: Users },
  { title: "Funil de Vendas", url: "/pipeline", icon: Columns3 },
  { title: "Vendas", url: "/vendas", icon: ShoppingCart },
  { title: "Clientes", url: "/clientes", icon: UserCheck },
  { title: "Clientes por Produto", url: "/clientes/por-produto", icon: Package },
  { title: "Alertas de Churn", url: "/alertas", icon: Bell },
  { title: "Presença", url: "/registro-presenca", icon: ClipboardCheck },
  { title: "Calendário", url: "/calendario-aulas", icon: Calendar },

  { title: "Interações", url: "/interacoes", icon: MessageCircle },
  { title: "Tarefas", url: "/tarefas", icon: CheckSquare },
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Integrações", url: "/integracoes", icon: Plug },
];

export function AppSidebar() {
  const { open, setOpen } = useSidebar();
  const location = useLocation();
  const collapsed = !open;
  const { user, signOut } = useAuth();
  const { canAccessSettings, isSuperadmin } = useUserRole();

  const [profileName, setProfileName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setProfileName(data.full_name || null);
        setAvatarUrl(data.avatar_url || null);
      }
    };
    fetchProfile();
  }, [user?.id]);

  const items = [
    ...baseItems,
    ...(canAccessSettings
      ? [
          { title: "Configurações", url: "/configuracoes", icon: Settings },
          { title: "Personalizar", url: "/personalizar", icon: Palette },
        ]
      : []),
    ...(isSuperadmin
      ? [
          { title: "Superadmin", url: "/superadmin", icon: Shield },
          { title: "Todos Usuários", url: "/admin/users", icon: Users },
        ]
      : []),
  ];

  const initials = profileName
    ? profileName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <Sidebar>
      <SidebarContent>
        {/* Organization Switcher (SuperAdmin only) */}
        {!collapsed && <OrganizationSwitcher />}

        {/* User & Organization Info */}
        {!collapsed && (
          <div className="pt-2 pb-1 px-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={profileName || "Usuário"} />
                ) : (
                  <AvatarFallback className="bg-primary-100 text-primary-700 text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="min-w-0 flex-1">
                {profileName ? (
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {profileName}
                  </p>
                ) : (
                  <Skeleton className="h-4 w-24" />
                )}
              </div>
            </div>
            <Separator className="mt-4 mb-2" />
          </div>
        )}

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    active={location.pathname === item.url}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        // @ts-ignore
                        setOpen(false);
                      }
                    }}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={cn(
                        "flex items-center w-full px-3 py-2 hover:bg-primary-50 transition-colors duration-150 rounded-lg",
                        location.pathname === item.url ? 'bg-primary-50 text-primary-700 font-semibold' : ''
                      )}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild active={location.pathname === "/perfil"}>
              <NavLink
                to="/perfil"
                className="flex items-center w-full px-3 py-2 hover:bg-primary-50 transition-colors duration-150 rounded-lg"
              >
                <User className="mr-2 h-4 w-4" />
                {!collapsed && <span className="text-sm">Meu Perfil</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-4 py-4">
          <Button variant="secondary" size="sm"
            onClick={signOut}
            className="flex items-center gap-3 w-full"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sair</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
