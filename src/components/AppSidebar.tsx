import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Columns3, UserCheck, MessageCircle,
  CheckSquare, Package, BarChart3, Settings, LogOut, Shield, User, Palette,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const baseItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Pipeline", url: "/pipeline", icon: Columns3 },
  { title: "Clientes", url: "/clientes", icon: UserCheck },
  { title: "Interações", url: "/interacoes", icon: MessageCircle },
  { title: "Tarefas", url: "/tarefas", icon: CheckSquare },
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();
  const { canAccessSettings, isSuperadmin } = useUserRole();
  const { brand } = useBrand();
  const { organization } = useOrganization();

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
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* User Info */}

        {/* User & Organization Info */}
        {!collapsed && (
          <div className="px-4 pb-1">
            <div className="flex items-center gap-2.5">
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
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-sans font-medium">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/60 transition-colors duration-150 rounded-lg"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium shadow-sm"
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

      <SidebarFooter className="p-2 space-y-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/perfil"
                className="hover:bg-sidebar-accent/60 transition-colors duration-150 rounded-lg"
                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium shadow-sm"
              >
                <User className="mr-2 h-4 w-4" />
                {!collapsed && <span className="text-sm">Meu Perfil</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sair</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
