import {
  LayoutDashboard, Users, Columns3, UserCheck, MessageCircle,
  CheckSquare, Package, BarChart3, Settings, LogOut, Shield, User } from
"lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar } from
"@/components/ui/sidebar";

const baseItems = [
{ title: "Dashboard", url: "/", icon: LayoutDashboard },
{ title: "Leads", url: "/leads", icon: Users },
{ title: "Pipeline", url: "/pipeline", icon: Columns3 },
{ title: "Clientes", url: "/clientes", icon: UserCheck },
{ title: "Interações", url: "/interacoes", icon: MessageCircle },
{ title: "Tarefas", url: "/tarefas", icon: CheckSquare },
{ title: "Produtos", url: "/produtos", icon: Package },
{ title: "Relatórios", url: "/relatorios", icon: BarChart3 }];


export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
  const { canAccessSettings, isSuperadmin } = useUserRole();

  const items = [
  ...baseItems,
  ...(canAccessSettings ? [{ title: "Configurações", url: "/configuracoes", icon: Settings }] : []),
  ...(isSuperadmin ? [{ title: "Superadmin", url: "/superadmin", icon: Shield }] : [])];


  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 pb-2">
          {!collapsed ?
          <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-sm bg-yellow-600 text-yellow-600">
                💃
              </div>
              <h1 className="text-base font-display tracking-wide text-yellow-600">
                CRM sem nome 
              </h1>
            </div> :

          <div className="flex justify-center">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-sm">
                💃
              </div>
            </div>
          }
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-sans font-medium">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) =>
              <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                    to={item.url}
                    end={item.url === "/"}
                    className="hover:bg-sidebar-accent/60 transition-colors duration-150 rounded-lg"
                    activeClassName="bg-sidebar-accent text-sidebar-primary font-medium shadow-sm">
                    
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
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
                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium shadow-sm">
                
                <User className="mr-2 h-4 w-4" />
                {!collapsed && <span className="text-sm">Meu Perfil</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 rounded-lg transition-colors">
          
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sair</span>}
        </button>
      </SidebarFooter>
    </Sidebar>);

}