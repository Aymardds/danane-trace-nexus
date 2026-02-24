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
  Building2,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: AppRole[]; // which roles can see this item
}

const allMenuItems: MenuItem[] = [
  { title: "Tableau de bord", url: "/dashboard", icon: LayoutDashboard, roles: ["admin", "producteur", "cooperative", "collecteur", "transformateur", "conditionneur", "distributeur"] },
  { title: "Parcelles", url: "/dashboard/parcelles", icon: MapPin, roles: ["producteur", "cooperative", "admin"] },
  { title: "Récoltes", url: "/dashboard/recoltes", icon: Wheat, roles: ["producteur", "cooperative", "admin"] },
  { title: "Collecte", url: "/dashboard/collecte", icon: Truck, roles: ["collecteur", "cooperative", "admin"] },
  { title: "Transformation", url: "/dashboard/transformation", icon: Factory, roles: ["transformateur", "admin"] },
  { title: "Conditionnement", url: "/dashboard/conditionnement", icon: Package, roles: ["conditionneur", "admin"] },
  { title: "QR Codes", url: "/dashboard/qrcodes", icon: QrCode, roles: ["conditionneur", "distributeur", "admin"] },
  { title: "Coopérative", url: "/dashboard/cooperative", icon: Building2, roles: ["cooperative", "admin"] },
  { title: "Audits", url: "/dashboard/audits", icon: ClipboardCheck, roles: ["admin"] },
  { title: "Utilisateurs", url: "/dashboard/utilisateurs", icon: Users, roles: ["admin"] },
];

interface AppSidebarProps {
  email?: string;
  roles: AppRole[];
  requestedRole?: string | null;
  onSignOut: () => void;
}

export function AppSidebar({ email, roles, requestedRole, onSignOut }: AppSidebarProps) {
  // Filter menu items based on user roles. If no roles assigned yet, show based on requested role
  const effectiveRoles: AppRole[] = roles.length > 0
    ? roles
    : requestedRole
      ? [requestedRole as AppRole]
      : ["producteur"];

  const visibleItems = allMenuItems.filter((item) =>
    item.roles.some((r) => effectiveRoles.includes(r))
  );

  const roleLabels: Record<string, string> = {
    producteur: "Producteur",
    cooperative: "Coopérative",
    collecteur: "Collecteur",
    transformateur: "Transformateur",
    conditionneur: "Conditionneur",
    distributeur: "Distributeur",
    admin: "Administrateur",
  };

  const displayRole = effectiveRoles[0] ? roleLabels[effectiveRoles[0]] ?? effectiveRoles[0] : "";

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
              {visibleItems.map((item) => (
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
        {displayRole && (
          <div className="mb-2">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold bg-sidebar-primary/20 text-sidebar-primary">
              {displayRole}
            </span>
          </div>
        )}
        <div className="text-xs text-sidebar-foreground/50 mb-3 truncate">
          {email}
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </Sidebar>
  );
}
