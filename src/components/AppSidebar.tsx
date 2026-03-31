import { Home, Plus, MessageSquare, Upload, Settings, Database, Linkedin, FolderOpen } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { BCALogo } from "@/components/BCALogo";

const navItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Neue Präsentation", url: "/new", icon: Plus },
  { title: "Aus Projekt", url: "/new/from-project", icon: Database },
  { title: "Chat-Assistent", url: "/chat", icon: MessageSquare },
  { title: "Upload", url: "/upload", icon: Upload },
  { title: "Einstellungen", url: "/settings", icon: Settings },
  { title: "Carlettos Projekt", url: "/carlettos-projekt", icon: FolderOpen },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("user_settings").select("first_name, last_name").limit(1).maybeSingle()
      .then(({ data }) => {
        if (data?.first_name) setUserName(`${data.first_name}${data.last_name ? ` ${data.last_name}` : ""}`);
      });
  }, []);

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="p-4 border-b border-border">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <BCALogo variant="blue" className="h-8 w-auto" />
            <span className="font-heading font-normal text-sm text-brand-blue">Slide Studio</span>
          </div>
        ) : (
          <span className="font-heading font-bold text-lg text-navy">B</span>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        {!collapsed && userName && (
          <div className="text-xs text-muted-foreground px-2">
            {userName}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
