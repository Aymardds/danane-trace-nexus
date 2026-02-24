import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  MapPin,
  Wheat,
  Truck,
  Factory,
  Package,
  ClipboardCheck,
  Users,
  LogOut,
  Leaf,
  QrCode,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const menuItems = [
  { title: "Tableau de bord", url: "/dashboard", icon: LayoutDashboard },
  { title: "Parcelles", url: "/dashboard/parcelles", icon: MapPin },
  { title: "Récoltes", url: "/dashboard/recoltes", icon: Wheat },
  { title: "Collecte", url: "/dashboard/collecte", icon: Truck },
  { title: "Transformation", url: "/dashboard/transformation", icon: Factory },
  { title: "Conditionnement", url: "/dashboard/conditionnement", icon: Package },
  { title: "QR Codes", url: "/dashboard/qrcodes", icon: QrCode },
  { title: "Audits", url: "/dashboard/audits", icon: ClipboardCheck },
  { title: "Utilisateurs", url: "/dashboard/utilisateurs", icon: Users },
];

export function AppSidebar({ user }: { user: User | null }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <Leaf className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-serif font-bold text-sidebar-foreground text-sm block leading-tight">Riz Danané</span>
          <span className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">IGP Traçabilité</span>
        </div>
        <SidebarTrigger className="text-sidebar-foreground/60 hover:text-sidebar-foreground" />
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/50 mb-3 truncate">
          {user?.email}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </Sidebar>
  );
}
