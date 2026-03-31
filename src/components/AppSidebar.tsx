import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Columns3, UserCheck, MessageCircle,
  CheckSquare, Package, BarChart3, Settings, LogOut, Shield, User, Palette, ShoppingCart
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
  SidebarMenu
  SidebarMenuItem,
  SidebarFooter, 
  useSidebar,
 
} from "@/components/ui/ds";

const baseItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Funil de Vendas", url: "/pipeline", icon: Columns3 },
  { title: "Vendas", url: "/vendas", icon: ShoppingCart },
  { title: "Clientes", url: "/clientes", icon: UserCheck },

  { title: "Interações", url: "/interacoes", icon: MessageCircle },
  { title: "Tarefas", url: "/tarefas", icon: CheckSquare },
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";
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
          <div className="px-4 pt-4 pb-1">
            <div className="flex items-center gap-3.5">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={avatarUrl || undefined} alt={profileName || "Usuário"} />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">
                  {profileName || "Carregando..."}
                </p>
              </div>
            </div>
            <Separator className="mt-3 bg-sidebar-foreground/10" />
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
                  <SidebarMenu asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={cn(
                        "hover:bg-sidebar-accent/60 transition-colors duration-150 rounded-lg",
                        item.url === '/vendas' && location.pathname === '/vendas' 
                          ? 'bg-blue-100 text-blue-700 font-semibold' 
                          : ''
                      )}
                      activeClassName={item.url === '/vendas' ? '' : "bg-sidebar-accent text-sidebar-primary font-medium shadow-sm"}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 space-y-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenu asChild>
              <NavLink
                to="/perfil"
                className="hover:bg-sidebar-accent/60 transition-colors duration-150 rounded-lg"
                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium shadow-sm"
              >
                <User className="mr-2 h-4 w-4" />
                {!collapsed && <span className="text-sm">Meu Perfil</span>}
              </NavLink>
            </SidebarMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        < variant="secondary" size="sm"
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sair</span>}
        </>
      </SidebarFooter>
    </Sidebar>
  );
}
